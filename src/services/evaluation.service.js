const { EvaluationTask, TaskEvaluation, SusSubmission, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { calculateSusScore } = require('./sus.service');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const PARTICIPANT_CODE_PATTERN = /^[A-Za-z0-9_-]{2,50}$/;

const getTasks = async () => {
  const tasks = await EvaluationTask.find({ isActive: true }).sort({ createdAt: 1 });
  return tasks.map((task) => task.toClientObject());
};

const resolveParticipantCode = async (user, suppliedCode) => {
  const candidate = suppliedCode ? String(suppliedCode).trim() : `P-${user._id.toString().slice(-8)}`;

  if (!PARTICIPANT_CODE_PATTERN.test(candidate)) {
    throw ApiError.badRequest('participantCode may only contain letters, numbers, hyphens and underscores', 'INVALID_PARTICIPANT_CODE');
  }

  if (user.researchParticipantCode) {
    if (user.researchParticipantCode !== candidate) {
      throw ApiError.conflict('This participant already uses a different research code', 'PARTICIPANT_CODE_MISMATCH', {
        expected: 'Use the participant code assigned to this account'
      });
    }
    return user.researchParticipantCode;
  }

  const collision = await User.exists({ researchParticipantCode: candidate, _id: { $ne: user._id } });
  if (collision) {
    throw ApiError.conflict('This participant code is already assigned to another account', 'PARTICIPANT_CODE_IN_USE');
  }

  try {
    await User.updateOne(
      { _id: user._id, researchParticipantCode: null },
      { $set: { researchParticipantCode: candidate } }
    );
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('This participant code is already assigned to another account', 'PARTICIPANT_CODE_IN_USE');
    }
    throw error;
  }

  const fresh = await User.findById(user._id);
  if (fresh.researchParticipantCode !== candidate) {
    throw ApiError.conflict('This participant already uses a different research code', 'PARTICIPANT_CODE_MISMATCH');
  }

  return candidate;
};

const requireActiveTask = async (taskId) => {
  const task = await EvaluationTask.findOne({ _id: taskId, isActive: true });
  if (!task) throw ApiError.notFound('Evaluation task not found or inactive');
  return task;
};

const startTask = async (user, taskId, suppliedCode) => {
  await requireActiveTask(taskId);
  const participantCode = await resolveParticipantCode(user, suppliedCode);

  const record = await TaskEvaluation.create({
    participantCode,
    ownerUserId: user._id,
    taskId,
    startedAt: new Date(),
    status: 'in_progress'
  });

  return record.toClientObject();
};

const completeTask = async (user, taskId, payload) => {
  await requireActiveTask(taskId);
  const participantCode = await resolveParticipantCode(user, payload.participantCode);

  const filter = {
    taskId,
    ownerUserId: user._id,
    status: 'in_progress'
  };
  if (payload.taskEvaluationId) filter._id = payload.taskEvaluationId;
  else filter.participantCode = participantCode;

  const record = await TaskEvaluation.findOne(filter).sort({ startedAt: -1 });
  if (!record) throw ApiError.notFound('No in-progress task attempt was found for this participant');

  const completedAt = new Date();
  record.completedAt = completedAt;
  record.completionTimeSeconds = Math.round(((completedAt - record.startedAt) / 1000) * 100) / 100;
  record.isSuccessful = payload.isSuccessful;
  record.errorCount = payload.errorCount ?? 0;
  record.assistanceRequired = payload.assistanceRequired ?? false;
  record.notes = payload.notes || '';
  record.status = 'completed';
  await record.save();

  return record.toClientObject();
};

const submitSus = async (user, { participantCode, responses }) => {
  const { questionScores, totalSusScore } = calculateSusScore(responses);
  const resolvedCode = await resolveParticipantCode(user, participantCode);

  const submission = await SusSubmission.create({
    participantCode: resolvedCode,
    ownerUserId: user._id,
    responses,
    questionScores,
    totalSusScore,
    submittedAt: new Date()
  });

  return submission.toClientObject();
};

const getAttemptForUser = async (user, id) => {
  const record = await TaskEvaluation.findOne({ _id: id, ownerUserId: user._id });
  if (!record) throw ApiError.notFound('Task attempt not found');
  return record.toClientObject();
};

const getAttemptForAdmin = async (id) => {
  const record = await TaskEvaluation.findById(id);
  if (!record) throw ApiError.notFound('Task attempt not found');
  return record.toClientObject();
};

const listAttemptsForAdmin = async (query = {}) => {
  const pagination = getPagination(query);
  const filter = {};
  if (query.participantCode) filter.participantCode = query.participantCode;
  if (query.taskId) filter.taskId = query.taskId;

  const [items, total] = await Promise.all([
    TaskEvaluation.find(filter)
      .sort({ startedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    TaskEvaluation.countDocuments(filter)
  ]);

  return {
    items: items.map((item) => item.toClientObject()),
    meta: getPaginationMeta(pagination, total)
  };
};

const getTaskMetricsFromRecords = (records) => {
  const totalAttempts = records.length;
  const successfulAttempts = records.filter((record) => record.isSuccessful === true).length;
  const unsuccessfulAttempts = records.filter((record) => record.isSuccessful === false).length;
  const timedRecords = records.filter(
    (record) => record.isSuccessful === true && Number.isFinite(record.completionTimeSeconds)
  );
  const totalTime = timedRecords.reduce((sum, record) => sum + record.completionTimeSeconds, 0);

  return {
    totalAttempts,
    successfulAttempts,
    unsuccessfulAttempts,
    taskSuccessRate: totalAttempts === 0 ? null : (successfulAttempts / totalAttempts) * 100,
    averageCompletionTimeSeconds: timedRecords.length === 0 ? null : totalTime / timedRecords.length,
    timedAttemptsIncluded: timedRecords.length
  };
};

module.exports = {
  getTasks,
  resolveParticipantCode,
  startTask,
  completeTask,
  submitSus,
  getAttemptForUser,
  getAttemptForAdmin,
  listAttemptsForAdmin,
  getTaskMetricsFromRecords
};

const { MasAssessment, TaskEvaluation, SusSubmission } = require('../models');
const { getTaskMetricsFromRecords } = require('./evaluation.service');
const { parseDate } = require('../utils/pagination');
const { ASSESSMENT_STATUSES } = require('../constants');

const buildReport = async ({ from, to, participantCode } = {}) => {
  const fromDate = parseDate(from, 'from');
  const toDate = parseDate(to, 'to');

  const masFilter = { assessmentStatus: ASSESSMENT_STATUSES.COMPLETED };
  if (fromDate || toDate) {
    masFilter.completedAt = {};
    if (fromDate) masFilter.completedAt.$gte = fromDate;
    if (toDate) masFilter.completedAt.$lte = toDate;
  }

  const taskFilter = { status: 'completed' };
  if (participantCode) taskFilter.participantCode = participantCode;
  if (fromDate || toDate) {
    taskFilter.startedAt = {};
    if (fromDate) taskFilter.startedAt.$gte = fromDate;
    if (toDate) taskFilter.startedAt.$lte = toDate;
  }

  const susFilter = {};
  if (participantCode) susFilter.participantCode = participantCode;
  if (fromDate || toDate) {
    susFilter.submittedAt = {};
    if (fromDate) susFilter.submittedAt.$gte = fromDate;
    if (toDate) susFilter.submittedAt.$lte = toDate;
  }

  const [latestMas, taskRecords, susRecords] = await Promise.all([
    MasAssessment.findOne(masFilter).sort({ completedAt: -1 }),
    TaskEvaluation.find(taskFilter).lean(),
    SusSubmission.find(susFilter).lean()
  ]);

  const taskMetrics = getTaskMetricsFromRecords(taskRecords);
  const participantCodes = new Set([
    ...taskRecords.map((record) => record.participantCode),
    ...susRecords.map((record) => record.participantCode)
  ]);

  const susTotal = susRecords.reduce((sum, record) => sum + record.totalSusScore, 0);

  return {
    evaluationPeriod: {
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      participantCode: participantCode || null
    },
    mas: {
      overallMAS: latestMas ? latestMas.overallMAS : null,
      dimensionScores: latestMas ? latestMas.dimensionScores : [],
      assessedVersion: latestMas ? latestMas.assessedVersion : null,
      completedAt: latestMas ? latestMas.completedAt : null,
      assessmentId: latestMas ? latestMas._id.toString() : null
    },
    taskMetrics,
    sus: {
      submissionCount: susRecords.length,
      averageScore: susRecords.length === 0 ? null : susTotal / susRecords.length,
      scores: susRecords.map((record) => record.totalSusScore)
    },
    participants: {
      count: participantCodes.size
    }
  };
};

module.exports = { buildReport };

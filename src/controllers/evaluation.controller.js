const evaluationService = require('../services/evaluation.service');
const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const tasks = async (req, res) => {
  const data = await evaluationService.getTasks();
  return sendSuccess(res, { message: 'Evaluation tasks retrieved', data });
};

const startTask = async (req, res) => {
  const data = await evaluationService.startTask(req.user, req.params.taskId, req.body.participantCode);
  return sendSuccess(res, { status: 201, message: 'Task attempt started', data });
};

const completeTask = async (req, res) => {
  const data = await evaluationService.completeTask(req.user, req.params.taskId, req.body);
  return sendSuccess(res, { message: 'Task attempt recorded', data });
};

const submitSus = async (req, res) => {
  const data = await evaluationService.submitSus(req.user, req.body);
  return sendSuccess(res, { status: 201, message: 'SUS response recorded', data });
};

const report = async (req, res) => {
  const data = await reportService.buildReport({
    from: req.query.from,
    to: req.query.to,
    participantCode: req.query.participantCode
  });
  return sendSuccess(res, { message: 'Evaluation report generated', data });
};

const attempt = async (req, res) => {
  const data = await evaluationService.getAttemptForUser(req.user, req.params.id);
  return sendSuccess(res, { message: 'Task attempt retrieved', data });
};

module.exports = { tasks, startTask, completeTask, submitSus, report, attempt };

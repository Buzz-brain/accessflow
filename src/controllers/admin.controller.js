const mamService = require('../services/mam.service');
const masService = require('../services/mas.service');
const authService = require('../services/auth.service');
const reportService = require('../services/report.service');
const evaluationService = require('../services/evaluation.service');
const { sendSuccess } = require('../utils/response');

const listDimensions = async (req, res) => {
  const data = await mamService.listDimensions({ activeOnly: false });
  return sendSuccess(res, { message: 'All accessibility dimensions retrieved', data });
};

const createDimension = async (req, res) => {
  const dimension = await mamService.createDimension(req.body);
  return sendSuccess(res, { status: 201, message: 'Accessibility dimension created', data: dimension.toClientObject() });
};

const updateDimension = async (req, res) => {
  const dimension = await mamService.updateDimension(req.params.code, req.body);
  return sendSuccess(res, { message: 'Accessibility dimension updated', data: dimension.toClientObject() });
};

const listCriteria = async (req, res) => {
  const data = await mamService.listCriteria();
  return sendSuccess(res, { message: 'All accessibility criteria retrieved', data });
};

const createCriterion = async (req, res) => {
  const criterion = await mamService.createCriterion(req.body);
  return sendSuccess(res, { status: 201, message: 'Accessibility criterion created', data: criterion.toClientObject() });
};

const updateCriterion = async (req, res) => {
  const criterion = await mamService.updateCriterion(req.params.code, req.body);
  return sendSuccess(res, { message: 'Accessibility criterion updated', data: criterion.toClientObject() });
};

const deactivateCriterion = async (req, res) => {
  const criterion = await mamService.deactivateCriterion(req.params.code);
  return sendSuccess(res, { message: 'Accessibility criterion deactivated', data: criterion.toClientObject() });
};

const updateWeights = async (req, res) => {
  const data = await mamService.updateWeights(req.body);
  return sendSuccess(res, { message: 'MAS dimension weights updated', data });
};

const assessments = async (req, res) => {
  const result = await masService.listAssessments({ status: req.query.status, page: 1, limit: 100 });
  return sendSuccess(res, {
    message: 'All MAS assessments retrieved',
    data: result.items.map((item) => item.toClientObject())
  });
};

const users = async (req, res) => {
  const data = await authService.listUsers();
  return sendSuccess(res, { message: 'Users retrieved', data });
};

const setUserActive = async (req, res) => {
  const data = await authService.setUserActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { message: 'User status updated', data });
};

const evaluationReport = async (req, res) => {
  const data = await reportService.buildReport(req.query);
  return sendSuccess(res, { message: 'Evaluation report generated', data });
};

const tasks = async (req, res) => {
  const data = await evaluationService.getTasks();
  return sendSuccess(res, { message: 'Evaluation tasks retrieved', data });
};

const evaluationAttempt = async (req, res) => {
  const data = await evaluationService.getAttemptForAdmin(req.params.id);
  return sendSuccess(res, { message: 'Task attempt retrieved', data });
};

const evaluationAttempts = async (req, res) => {
  const result = await evaluationService.listAttemptsForAdmin(req.query);
  return sendSuccess(res, {
    message: 'Task attempts retrieved',
    data: result.items,
    meta: result.meta
  });
};

module.exports = {
  listDimensions,
  createDimension,
  updateDimension,
  listCriteria,
  createCriterion,
  updateCriterion,
  deactivateCriterion,
  updateWeights,
  assessments,
  users,
  setUserActive,
  evaluationReport,
  tasks,
  evaluationAttempt,
  evaluationAttempts
};

const masService = require('../services/mas.service');
const { getPagination } = require('../utils/pagination');
const { sendSuccess } = require('../utils/response');

const createAssessment = async (req, res) => {
  const assessment = await masService.createAssessment(req.body, req.user._id);

  return sendSuccess(res, {
    status: 201,
    message: 'MAS assessment draft created',
    data: assessment.toClientObject()
  });
};

const listAssessments = async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await masService.listAssessments({
    status: req.query.status,
    page: pagination.page,
    limit: pagination.limit
  });

  return sendSuccess(res, {
    message: 'MAS assessments retrieved',
    data: result.items.map((item) => item.toClientObject()),
    meta: { ...pagination, total: result.total, totalPages: Math.ceil(result.total / pagination.limit) }
  });
};

const getAssessment = async (req, res) => {
  const assessment = await masService.getAssessmentById(req.params.id);

  return sendSuccess(res, { message: 'MAS assessment retrieved', data: assessment.toClientObject() });
};

const saveScores = async (req, res) => {
  const assessment = await masService.saveScores(req.params.id, req.body, req.user._id);

  return sendSuccess(res, {
    message: assessment.isComplete
      ? 'All criterion scores recorded. The assessment is ready to be completed.'
      : 'Criterion scores saved to the assessment draft.',
    data: assessment.toClientObject()
  });
};

const completeAssessment = async (req, res) => {
  const assessment = await masService.completeAssessment(req.params.id, req.body, req.user._id);

  return sendSuccess(res, {
    message: 'MAS assessment completed',
    data: assessment.toClientObject()
  });
};

const latestResult = async (req, res) => {
  const assessment = await masService.getLatestCompletedAssessment();

  if (!assessment) {
    return sendSuccess(res, {
      message: 'No completed MAS assessment is available',
      data: null
    });
  }

  return sendSuccess(res, {
    message: 'Latest completed MAS result retrieved',
    data: assessment.toClientObject()
  });
};

module.exports = { createAssessment, listAssessments, getAssessment, saveScores, completeAssessment, latestResult };

const mamService = require('../services/mam.service');
const { sendSuccess } = require('../utils/response');

const dimensions = async (req, res) => {
  const data = await mamService.listDimensions();

  return sendSuccess(res, {
    message: 'MAM dimensions retrieved',
    data
  });
};

const criteria = async (req, res) => {
  const data = await mamService.listCriteria({
    dimensionCode: req.query.dimensionCode,
    isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true'
  });

  return sendSuccess(res, { message: 'MAM criteria retrieved', data });
};

const weights = async (req, res) => {
  const data = await mamService.getWeights();

  return sendSuccess(res, {
    message: 'Current MAS dimension weights retrieved',
    data
  });
};

module.exports = { dimensions, criteria, weights };

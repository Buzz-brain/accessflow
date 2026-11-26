const AccessibilityDimension = require('../models/AccessibilityDimension');
const AccessibilityCriterion = require('../models/AccessibilityCriterion');
const { DIMENSION_ORDER } = require('../constants');
const ApiError = require('../utils/ApiError');
const { normalizeWeights } = require('./mas.service');

const listCriteria = async ({ dimensionCode, isActive } = {}) => {
  const filter = {};
  if (dimensionCode) filter.dimensionCode = dimensionCode;
  if (isActive !== undefined) filter.isActive = isActive;

  const criteria = await AccessibilityCriterion.find(filter).sort({ dimensionCode: 1, code: 1 });
  return criteria.map((criterion) => criterion.toClientObject());
};

const listDimensions = async ({ activeOnly = true } = {}) => {
  const filter = activeOnly ? { isActive: true } : {};
  const dimensions = await AccessibilityDimension.find(filter).sort({ code: 1 });
  const criteria = await AccessibilityCriterion.find().sort({ dimensionCode: 1, code: 1 });

  return dimensions.map((dimension) => ({
    ...dimension.toClientObject(),
    criteria: criteria
      .filter((criterion) => criterion.dimensionCode === dimension.code)
      .map((criterion) => criterion.toClientObject())
  }));
};

const getWeights = async () => {
  const dimensions = await AccessibilityDimension.find().select('code weight').lean();
  const weights = {};

  for (const code of DIMENSION_ORDER) {
    const dimension = dimensions.find((item) => item.code === code);
    if (!dimension) throw new ApiError(500, `Dimension ${code} is not configured`, 'CONFIGURATION_ERROR');
    weights[code] = dimension.weight;
  }

  return weights;
};

const updateWeights = async (weights) => {
  const normalized = normalizeWeights(weights);

  await Promise.all(
    DIMENSION_ORDER.map((code) =>
      AccessibilityDimension.updateOne({ code }, { $set: { weight: normalized[code] } })
    )
  );

  return getWeights();
};

const createDimension = async (payload) => {
  const existing = await AccessibilityDimension.findOne({ code: payload.code });
  if (existing) throw ApiError.conflict(`Dimension ${payload.code} already exists`, 'DUPLICATE_VALUE');

  return AccessibilityDimension.create(payload);
};

const updateDimension = async (code, payload) => {
  const dimension = await AccessibilityDimension.findOne({ code });
  if (!dimension) throw ApiError.notFound('Accessibility dimension not found');

  if (payload.weight !== undefined) {
    const weights = await getWeights();
    weights[code] = payload.weight;
    normalizeWeights(weights);
  }

  Object.assign(dimension, payload);
  await dimension.save();
  return dimension;
};

const createCriterion = async (payload) => {
  const existing = await AccessibilityCriterion.findOne({ code: payload.code });
  if (existing) throw ApiError.conflict(`Criterion ${payload.code} already exists`, 'DUPLICATE_VALUE');

  const criterion = await AccessibilityCriterion.create(payload);
  await AccessibilityDimension.updateOne({ code: criterion.dimensionCode }, { $addToSet: { criteria: criterion._id } });
  return criterion;
};

const updateCriterion = async (code, payload) => {
  const criterion = await AccessibilityCriterion.findOne({ code });
  if (!criterion) throw ApiError.notFound('Accessibility criterion not found');

  const previousDimension = criterion.dimensionCode;
  Object.assign(criterion, payload);
  await criterion.save();

  if (payload.dimensionCode && payload.dimensionCode !== previousDimension) {
    await AccessibilityDimension.updateOne({ code: previousDimension }, { $pull: { criteria: criterion._id } });
    await AccessibilityDimension.updateOne({ code: criterion.dimensionCode }, { $addToSet: { criteria: criterion._id } });
  }

  return criterion;
};

const deactivateCriterion = async (code) => {
  const criterion = await AccessibilityCriterion.findOneAndUpdate({ code }, { $set: { isActive: false } }, { new: true });
  if (!criterion) throw ApiError.notFound('Accessibility criterion not found');
  return criterion;
};

module.exports = {
  listCriteria,
  listDimensions,
  getWeights,
  updateWeights,
  createDimension,
  updateDimension,
  createCriterion,
  updateCriterion,
  deactivateCriterion
};

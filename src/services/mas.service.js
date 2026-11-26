const {
  DIMENSION_ORDER,
  DIMENSION_NAMES,
  LOW_SCORE_THRESHOLD,
  ASSESSMENT_STATUSES
} = require('../constants');
const ApiError = require('../utils/ApiError');
const MasAssessment = require('../models/MasAssessment');
const AccessibilityCriterion = require('../models/AccessibilityCriterion');
const AccessibilityDimension = require('../models/AccessibilityDimension');

const calculateDimensionAverage = (scores) => {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  const values = scores.map(Number);
  if (values.some((value) => !Number.isFinite(value))) {
    throw ApiError.badRequest('Dimension scores must be finite numbers');
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const calculateMAS = (dimensionScores, weights) => {
  const byCode = new Map(dimensionScores.map((item) => [item.code, Number(item.score)]));
  let weightedSum = 0;
  let weightSum = 0;

  for (const code of DIMENSION_ORDER) {
    const score = byCode.get(code);
    const weight = Number(weights[code]);

    if (score === undefined || score === null || !Number.isFinite(score)) {
      throw ApiError.badRequest(`A score for dimension ${code} is required to calculate MAS`);
    }
    if (!Number.isFinite(weight) || weight < 0) {
      throw ApiError.badRequest(`A valid weight for dimension ${code} is required`);
    }

    weightedSum += score * weight;
    weightSum += weight;
  }

  if (weightSum === 0) throw ApiError.badRequest('The sum of dimension weights must be greater than zero');
  return weightedSum / weightSum;
};

const normalizeWeights = (weights = {}) => {
  const normalized = {};

  for (const code of DIMENSION_ORDER) {
    const value = Number(weights[code]);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw ApiError.badRequest(`Weight ${code} must be a number between 0 and 1`);
    }
    normalized[code] = value;
  }

  const total = DIMENSION_ORDER.reduce((sum, code) => sum + normalized[code], 0);
  if (Math.abs(total - 1) > 1e-9) {
    throw ApiError.badRequest('Dimension weights must sum to 1.00');
  }

  return normalized;
};

const criterionIdentifier = (criterion) =>
  criterion.criterionId || criterion._id || null;

const buildScoreEntry = (item, criteriaMap, { strict = true } = {}) => {
  const code = String(item.criterionCode || '').trim().toUpperCase();
  const criterion = criteriaMap.get(code);
  const score = Number(item.score);

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw ApiError.badRequest(`Score for criterion ${code || 'unknown'} must be between 0 and 100`);
  }
  if (!criterion && strict) {
    throw ApiError.badRequest(`Criterion ${code} is not part of this assessment`);
  }

  return {
    criterionId: criterionIdentifier(criterion) || item.criterionId,
    criterionCode: code,
    criterionName: criterion ? criterion.name : item.criterionName || code,
    dimensionCode: criterion ? criterion.dimensionCode : item.dimensionCode,
    score,
    evidence: typeof item.evidence === 'string' ? item.evidence : ''
  };
};

const validateScores = (scores, criteria) => {
  if (!Array.isArray(scores)) throw ApiError.badRequest('scores must be an array');

  const criteriaMap = new Map(criteria.map((criterion) => [criterion.code, criterion]));
  const seen = new Set();

  return scores.map((item) => {
    const entry = buildScoreEntry(item, criteriaMap);
    if (seen.has(entry.criterionCode)) {
      throw ApiError.badRequest(`Duplicate score submitted for criterion ${entry.criterionCode}`);
    }
    seen.add(entry.criterionCode);
    return entry;
  });
};

const analyzeAssessment = ({ criteria = [], dimensions = [], scores = [], existingScores = [], weights = {}, assessorId }) => {
  const normalizedWeights = normalizeWeights(weights);
  const criteriaMap = new Map(criteria.map((criterion) => [criterion.code, criterion]));
  const dimensionsMap = new Map(dimensions.map((dimension) => [dimension.code, dimension]));
  const incomingCodes = new Set();
  const assessedAt = new Date();

  const incomingScores = validateScores(scores, criteria).map((item) => {
    incomingCodes.add(item.criterionCode);
    return { ...item, assessedAt, assessedBy: assessorId };
  });

  const retainedScores = existingScores
    .filter((item) => !incomingCodes.has(String(item.criterionCode).toUpperCase()))
    .map((item) => {
      const entry = buildScoreEntry(item, criteriaMap, { strict: false });
      return {
        ...entry,
        assessedAt: item.assessedAt || assessedAt,
        assessedBy: item.assessedBy || assessorId
      };
    });

  const allScores = [...retainedScores, ...incomingScores];
  const activeCodes = new Set(criteria.map((criterion) => criterion.code));
  const scoredCodes = new Set(allScores.filter((item) => activeCodes.has(item.criterionCode)).map((item) => item.criterionCode));
  const missingCriteria = criteria.filter((criterion) => !scoredCodes.has(criterion.code)).map((criterion) => criterion.code);

  const dimensionScores = DIMENSION_ORDER.map((code) => {
    const dimensionCriteria = criteria.filter((criterion) => criterion.dimensionCode === code);
    const dimensionRawScores = allScores.filter((item) => item.dimensionCode === code && activeCodes.has(item.criterionCode));
    const score = calculateDimensionAverage(dimensionRawScores.map((item) => item.score));

    return {
      code,
      name: dimensionsMap.get(code)?.name || DIMENSION_NAMES[code],
      score,
      weight: normalizedWeights[code],
      weightedContribution: score === null ? null : score * normalizedWeights[code],
      assessedCount: dimensionRawScores.length,
      criteriaCount: dimensionCriteria.length
    };
  });

  const isComplete = missingCriteria.length === 0 && criteria.length > 0 && dimensionScores.every((item) => item.score !== null);
  const weightTotal = DIMENSION_ORDER.reduce((sum, code) => sum + normalizedWeights[code], 0);
  const overallMAS = isComplete
    ? dimensionScores.reduce((sum, item) => sum + item.weightedContribution, 0) / weightTotal
    : null;

  const ranked = dimensionScores
    .filter((item) => item.score !== null)
    .sort((a, b) => b.score - a.score);

  const toSummary = (item) => (item ? { code: item.code, name: item.name, score: item.score } : null);

  const lowScoringCriteria = allScores
    .filter((item) => activeCodes.has(item.criterionCode) && item.score < LOW_SCORE_THRESHOLD)
    .map((item) => ({
      code: item.criterionCode,
      name: item.criterionName,
      dimensionCode: item.dimensionCode,
      score: item.score
    }))
    .sort((a, b) => a.score - b.score);

  return {
    criterionScores: allScores,
    dimensionScores,
    weightsUsed: normalizedWeights,
    overallMAS,
    isComplete,
    missingCriteria,
    highestDimension: toSummary(ranked[0]),
    lowestDimension: toSummary(ranked[ranked.length - 1]),
    lowScoringCriteria,
    scoredCriteriaCount: scoredCodes.size,
    requiredCriteriaCount: criteria.length
  };
};

const getAssessmentCriteria = async () => {
  const activeDimensions = await AccessibilityDimension.find({ isActive: true }).select('code').lean();
  const activeCodes = activeDimensions.map((dimension) => dimension.code);

  return AccessibilityCriterion.find({ isActive: true, dimensionCode: { $in: activeCodes } })
    .sort({ dimensionCode: 1, code: 1 })
    .lean();
};

const getAssessmentDimensions = async () => {
  const dimensions = await AccessibilityDimension.find({ isActive: true }).lean();
  return DIMENSION_ORDER.map((code, index) => {
    const dimension = dimensions.find((item) => item.code === code);
    if (!dimension) throw new ApiError(500, `Accessibility dimension ${code} is not configured`, 'CONFIGURATION_ERROR');
    return { ...dimension, order: index };
  });
};

const getCurrentWeights = async () => {
  const dimensions = await AccessibilityDimension.find().select('code weight').lean();
  const weights = {};

  for (const code of DIMENSION_ORDER) {
    const dimension = dimensions.find((item) => item.code === code);
    if (!dimension) throw new ApiError(500, `Accessibility dimension ${code} is not configured`, 'CONFIGURATION_ERROR');
    weights[code] = dimension.weight;
  }

  return normalizeWeights(weights);
};

const buildCriteriaSnapshot = (criteria) =>
  criteria.map((criterion, index) => ({
    criterionId: criterion._id,
    code: criterion.code,
    name: criterion.name,
    description: criterion.description,
    dimensionCode: criterion.dimensionCode,
    assessmentInstructions: criterion.assessmentInstructions,
    assessmentMethod: criterion.assessmentMethod,
    maximumScore: criterion.maximumScore,
    isActive: criterion.isActive,
    order: index
  }));

const buildDimensionsSnapshot = (dimensions) =>
  dimensions.map((dimension) => ({
    code: dimension.code,
    name: dimension.name,
    description: dimension.description,
    weight: dimension.weight,
    isActive: dimension.isActive,
    order: dimension.order
  }));

const getAssessmentFramework = (assessment) => {
  const criteriaSnapshot = assessment.criteriaSnapshot || [];
  const dimensionsSnapshot = assessment.dimensionsSnapshot || [];

  if (criteriaSnapshot.length === 0 || dimensionsSnapshot.length === 0) {
    throw new ApiError(
      500,
      'This assessment predates criteria snapshotting and cannot be scored against a reproducible framework',
      'ASSESSMENT_SNAPSHOT_MISSING'
    );
  }

  return {
    criteria: criteriaSnapshot.map((item) => (item.toObject ? item.toObject() : item)),
    dimensions: dimensionsSnapshot.map((item) => (item.toObject ? item.toObject() : item))
  };
};

const applyAnalysis = (assessment, analysis, notes) => {
  assessment.criterionScores = analysis.criterionScores;
  assessment.dimensionScores = analysis.dimensionScores;
  assessment.weightsUsed = analysis.weightsUsed;
  assessment.overallMAS = analysis.overallMAS;
  assessment.isComplete = analysis.isComplete;
  assessment.missingCriteria = analysis.missingCriteria;
  assessment.highestDimension = analysis.highestDimension;
  assessment.lowestDimension = analysis.lowestDimension;
  assessment.lowScoringCriteria = analysis.lowScoringCriteria;
  assessment.scoredCriteriaCount = analysis.scoredCriteriaCount;
  assessment.requiredCriteriaCount = analysis.requiredCriteriaCount;
  if (notes !== undefined) assessment.assessmentNotes = notes;
  return assessment;
};

const createAssessment = async ({ assessmentName, assessedVersion, assessmentNotes = '' }, assessorId) => {
  const criteria = await getAssessmentCriteria();
  const dimensions = await getAssessmentDimensions();
  const weights = await getCurrentWeights();

  const assessment = await MasAssessment.create({
    assessmentName,
    assessedVersion,
    assessmentNotes,
    assessorId,
    criteriaSnapshot: buildCriteriaSnapshot(criteria),
    dimensionsSnapshot: buildDimensionsSnapshot(dimensions),
    weightsUsed: weights,
    missingCriteria: criteria.map((criterion) => criterion.code),
    requiredCriteriaCount: criteria.length
  });

  return assessment;
};

const getAssessmentById = async (id) => {
  const assessment = await MasAssessment.findById(id);
  if (!assessment) throw ApiError.notFound('MAS assessment not found');
  return assessment;
};

const listAssessments = async ({ status, page = 1, limit = 20 }) => {
  const filter = status ? { assessmentStatus: status } : {};
  const total = await MasAssessment.countDocuments(filter);
  const items = await MasAssessment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items, total };
};

const saveScores = async (id, { scores, assessmentNotes }, assessorId) => {
  const assessment = await getAssessmentById(id);
  if (assessment.assessmentStatus !== ASSESSMENT_STATUSES.DRAFT) {
    throw ApiError.conflict('Scores cannot be changed after an assessment is completed', 'ASSESSMENT_FINALIZED');
  }

  const { criteria, dimensions } = getAssessmentFramework(assessment);
  const analysis = analyzeAssessment({
    criteria,
    dimensions,
    scores,
    existingScores: assessment.criterionScores,
    weights: assessment.weightsUsed,
    assessorId
  });

  applyAnalysis(assessment, analysis, assessmentNotes);
  await assessment.save();
  return assessment;
};

const completeAssessment = async (id, { assessmentNotes }, assessorId) => {
  const assessment = await getAssessmentById(id);
  if (assessment.assessmentStatus !== ASSESSMENT_STATUSES.DRAFT) {
    throw ApiError.conflict('Assessment has already been completed', 'ASSESSMENT_FINALIZED');
  }

  const { criteria, dimensions } = getAssessmentFramework(assessment);
  const analysis = analyzeAssessment({
    criteria,
    dimensions,
    scores: [],
    existingScores: assessment.criterionScores,
    weights: assessment.weightsUsed,
    assessorId
  });

  if (!analysis.isComplete) {
    throw ApiError.badRequest('Assessment is incomplete and cannot produce a final MAS', 'ASSESSMENT_INCOMPLETE', {
      missingCriteria: analysis.missingCriteria
    });
  }

  applyAnalysis(assessment, analysis, assessmentNotes);
  assessment.assessmentStatus = ASSESSMENT_STATUSES.COMPLETED;
  assessment.completedAt = new Date();
  await assessment.save();
  return assessment;
};

const getLatestCompletedAssessment = async () => {
  const assessment = await MasAssessment.findOne({ assessmentStatus: ASSESSMENT_STATUSES.COMPLETED }).sort({ completedAt: -1 });
  if (!assessment) return null;
  return assessment;
};

module.exports = {
  calculateDimensionAverage,
  calculateMAS,
  normalizeWeights,
  validateScores,
  analyzeAssessment,
  getAssessmentCriteria,
  getAssessmentDimensions,
  getCurrentWeights,
  createAssessment,
  getAssessmentById,
  listAssessments,
  saveScores,
  completeAssessment,
  getLatestCompletedAssessment
};

const {
  calculateDimensionAverage,
  calculateMAS,
  normalizeWeights,
  validateScores,
  analyzeAssessment
} = require('../../services/mas.service');
const { DEFAULT_WEIGHTS } = require('../../constants');
const ApiError = require('../../utils/ApiError');

describe('MAS scoring engine', () => {
  test('calculates the arithmetic mean for a dimension', () => {
    expect(calculateDimensionAverage([80, 90, 70, 100])).toBe(85);
    expect(calculateDimensionAverage([])).toBeNull();
  });

  test('reproduces the illustrative research calculation (MAS ≈ 70.84)', () => {
    const dimensionScores = [
      { code: 'P', score: 66.7 },
      { code: 'O', score: 50.0 },
      { code: 'C', score: 100.0 },
      { code: 'S', score: 50.0 },
      { code: 'A', score: 100.0 }
    ];

    expect(calculateMAS(dimensionScores, DEFAULT_WEIGHTS)).toBeCloseTo(70.84, 2);
  });

  test('normalizes weights and rejects weights that do not sum to one', () => {
    expect(normalizeWeights(DEFAULT_WEIGHTS)).toEqual(DEFAULT_WEIGHTS);
    expect(() => normalizeWeights({ P: 0.5, O: 0.2, C: 0.2, S: 0.2, A: 0.2 })).toThrow(ApiError);
  });

  test('validates that every criterion score is between 0 and 100', () => {
    const criteria = [{ code: 'P01', dimensionCode: 'P', name: 'Label' }];

    expect(validateScores([{ criterionCode: 'P01', score: 100 }], criteria)).toHaveLength(1);
    expect(() => validateScores([{ criterionCode: 'P01', score: 101 }], criteria)).toThrow(ApiError);
    expect(() => validateScores([{ criterionCode: 'P01', score: -1 }], criteria)).toThrow(ApiError);
    expect(() => validateScores([{ criterionCode: 'X99', score: 50 }], criteria)).toThrow(ApiError);
  });

  test('computes all dimension scores, weighted contributions and low-scoring criteria', () => {
    const criteria = [
      { code: 'P01', dimensionCode: 'P', name: 'P one' },
      { code: 'P02', dimensionCode: 'P', name: 'P two' },
      { code: 'O01', dimensionCode: 'O', name: 'O one' },
      { code: 'C01', dimensionCode: 'C', name: 'C one' },
      { code: 'S01', dimensionCode: 'S', name: 'S one' },
      { code: 'A01', dimensionCode: 'A', name: 'A one' }
    ];
    const scores = [
      { criterionCode: 'P01', score: 80 },
      { criterionCode: 'P02', score: 100 },
      { criterionCode: 'O01', score: 40 },
      { criterionCode: 'C01', score: 100 },
      { criterionCode: 'S01', score: 70 },
      { criterionCode: 'A01', score: 60 }
    ];

    const result = analyzeAssessment({ criteria, scores, weights: DEFAULT_WEIGHTS });

    expect(result.isComplete).toBe(true);
    expect(result.dimensionScores.find((item) => item.code === 'P').score).toBe(90);
    expect(result.dimensionScores.find((item) => item.code === 'P').weightedContribution).toBe(18);
    expect(result.overallMAS).toBeCloseTo((90 * 0.2 + 40 * 0.2 + 100 * 0.2 + 70 * 0.25 + 60 * 0.15), 5);
    expect(result.highestDimension.code).toBe('C');
    expect(result.lowestDimension.code).toBe('O');
    expect(result.lowScoringCriteria.map((item) => item.code)).toEqual(['O01']);
  });

  test('treats an incomplete assessment as incomplete without a final MAS', () => {
    const criteria = [
      { code: 'P01', dimensionCode: 'P', name: 'P one' },
      { code: 'O01', dimensionCode: 'O', name: 'O one' }
    ];

    const result = analyzeAssessment({
      criteria,
      scores: [{ criterionCode: 'P01', score: 80 }],
      weights: DEFAULT_WEIGHTS
    });

    expect(result.isComplete).toBe(false);
    expect(result.overallMAS).toBeNull();
    expect(result.missingCriteria).toEqual(['O01']);
    expect(result.dimensionScores.find((item) => item.code === 'P').score).toBe(80);
    expect(result.dimensionScores.find((item) => item.code === 'O').score).toBeNull();
  });
});

const { calculateSusScore } = require('../../services/sus.service');
const { SUS_QUESTIONS } = require('../../constants');
const ApiError = require('../../utils/ApiError');

describe('SUS scoring', () => {
  test('uses the standard 10 questions', () => {
    expect(SUS_QUESTIONS).toHaveLength(10);
    expect(SUS_QUESTIONS[0]).toBe('I think that I would like to use this system frequently.');
  });

  test('scores an all-positive response set as 100', () => {
    const result = calculateSusScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]);
    expect(result.questionScores).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    expect(result.totalSusScore).toBe(100);
  });

  test('scores an all-negative response set as 0', () => {
    expect(calculateSusScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]).totalSusScore).toBe(0);
  });

  test('applies odd/even adjustments correctly to a mixed response set', () => {
    const result = calculateSusScore([5, 1, 3, 2, 4, 1, 5, 2, 4, 3]);
    expect(result.questionScores).toEqual([4, 4, 2, 3, 3, 4, 4, 3, 3, 2]);
    expect(result.totalSusScore).toBe(80);
  });

  test('rejects responses outside 1 to 5 or with the wrong length', () => {
    expect(() => calculateSusScore([1, 2, 3])).toThrow(ApiError);
    expect(() => calculateSusScore([0, 1, 1, 1, 1, 1, 1, 1, 1, 1])).toThrow(ApiError);
    expect(() => calculateSusScore([1, 1, 1, 1, 1, 1, 1, 1, 1, 6])).toThrow(ApiError);
  });
});

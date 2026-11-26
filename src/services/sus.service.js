const { SUS_QUESTIONS } = require('../constants');
const ApiError = require('../utils/ApiError');

const calculateSusScore = (responses) => {
  if (!Array.isArray(responses) || responses.length !== SUS_QUESTIONS.length) {
    throw ApiError.badRequest(`SUS requires exactly ${SUS_QUESTIONS.length} responses`);
  }

  const questionScores = responses.map((response, index) => {
    const value = Number(response);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw ApiError.badRequest(`Response ${index + 1} must be an integer from 1 to 5`);
    }
    return index % 2 === 0 ? value - 1 : 5 - value;
  });

  const total = questionScores.reduce((sum, value) => sum + value, 0) * 2.5;

  return {
    questionScores,
    totalSusScore: Math.round(total * 100) / 100
  };
};

module.exports = { calculateSusScore };

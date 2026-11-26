const accessibilityService = require('../services/accessibility.service');
const { sendSuccess, successFeedback } = require('../utils/response');

const getPreferences = async (req, res) => {
  const preferences = await accessibilityService.getPreferences(req.user._id);

  return sendSuccess(res, {
    message: 'Accessibility preferences retrieved',
    data: preferences,
    accessibilityFeedback: successFeedback('Your accessibility preferences have been loaded.')
  });
};

const updatePreferences = async (req, res) => {
  const preferences = await accessibilityService.updatePreferences(req.user._id, req.body);

  return sendSuccess(res, {
    message: 'Accessibility preferences updated',
    data: preferences,
    accessibilityFeedback: successFeedback('Your accessibility preferences have been saved.')
  });
};

const resetPreferences = async (req, res) => {
  const preferences = await accessibilityService.resetPreferences(req.user._id);

  return sendSuccess(res, {
    message: 'Accessibility preferences reset to defaults',
    data: preferences,
    accessibilityFeedback: successFeedback('Your accessibility preferences have been reset to their defaults.')
  });
};

module.exports = { getPreferences, updatePreferences, resetPreferences };

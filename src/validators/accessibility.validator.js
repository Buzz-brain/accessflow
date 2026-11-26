const { body } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { GESTURE_SENSITIVITY, ACCESSIBILITY_MODES } = require('../constants');

const update = [
  body('voiceGuidanceEnabled').optional().isBoolean().withMessage('voiceGuidanceEnabled must be a boolean'),
  body('voiceSpeed').optional().isFloat({ min: 0.5, max: 2 }).withMessage('voiceSpeed must be between 0.5 and 2'),
  body('vibrationEnabled').optional().isBoolean().withMessage('vibrationEnabled must be a boolean'),
  body('vibrationIntensity')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('vibrationIntensity must be an integer between 0 and 100'),
  body('gestureSensitivity')
    .optional()
    .isIn(GESTURE_SENSITIVITY)
    .withMessage('gestureSensitivity must be low, medium or high'),
  body('privacyMode').optional().isBoolean().withMessage('privacyMode must be a boolean'),
  body('highContrastEnabled').optional().isBoolean().withMessage('highContrastEnabled must be a boolean'),
  body('textScale').optional().isFloat({ min: 1, max: 2 }).withMessage('textScale must be between 1 and 2'),
  body('simplifiedNavigation').optional().isBoolean().withMessage('simplifiedNavigation must be a boolean'),
  body('preferredAccessibilityMode')
    .optional()
    .isIn(ACCESSIBILITY_MODES)
    .withMessage('preferredAccessibilityMode is not supported')
];

const allowedFields = new Set([
  'voiceGuidanceEnabled',
  'voiceSpeed',
  'vibrationEnabled',
  'vibrationIntensity',
  'gestureSensitivity',
  'privacyMode',
  'highContrastEnabled',
  'textScale',
  'simplifiedNavigation',
  'preferredAccessibilityMode'
]);

const requireAtLeastOnePreference = (req, res, next) => {
  const hasPreference = Object.keys(req.body || {}).some((key) => allowedFields.has(key));
  if (!hasPreference) return next(ApiError.badRequest('At least one accessibility preference must be provided'));
  return next();
};

module.exports = { update, requireAtLeastOnePreference, allowedFields };

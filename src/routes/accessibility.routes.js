const express = require('express');
const accessibilityController = require('../controllers/accessibility.controller');
const validator = require('../validators/accessibility.validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/preferences', asyncHandler(accessibilityController.getPreferences));
router.put('/preferences', validator.requireAtLeastOnePreference, validator.update, validate, asyncHandler(accessibilityController.updatePreferences));
router.post('/preferences/reset', asyncHandler(accessibilityController.resetPreferences));

module.exports = router;

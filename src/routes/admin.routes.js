const express = require('express');
const { param, body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const validator = require('../validators/admin.validator');
const evaluationValidator = require('../validators/evaluation.validator');
const { validate } = require('../middleware/validate');
const { protect, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/dimensions', asyncHandler(adminController.listDimensions));
router.post('/dimensions', validator.dimension, validate, asyncHandler(adminController.createDimension));
router.put(
  '/dimensions/:code',
  validator.dimensionUpdate,
  validate,
  asyncHandler(adminController.updateDimension)
);

router.get('/criteria', asyncHandler(adminController.listCriteria));
router.post('/criteria', validator.criterion, validate, asyncHandler(adminController.createCriterion));
router.put('/criteria/:code', validator.criterionUpdate, validate, asyncHandler(adminController.updateCriterion));
router.delete('/criteria/:code', asyncHandler(adminController.deactivateCriterion));

router.put('/mas/weights', validator.weights, validate, asyncHandler(adminController.updateWeights));

router.get('/mas/assessments', asyncHandler(adminController.assessments));
router.get('/users', asyncHandler(adminController.users));
router.patch(
  '/users/:id',
  [param('id').isMongoId(), body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  validate,
  asyncHandler(adminController.setUserActive)
);
router.get('/evaluation/reports', evaluationValidator.report, validate, asyncHandler(adminController.evaluationReport));
router.get('/evaluation/tasks', asyncHandler(adminController.tasks));
router.get('/evaluation/attempts', evaluationValidator.listAttempts, validate, asyncHandler(adminController.evaluationAttempts));
router.get(
  '/evaluation/attempts/:id',
  evaluationValidator.attemptDetail,
  validate,
  asyncHandler(adminController.evaluationAttempt)
);

module.exports = router;

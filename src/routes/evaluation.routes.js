const express = require('express');
const evaluationController = require('../controllers/evaluation.controller');
const validator = require('../validators/evaluation.validator');
const { validate } = require('../middleware/validate');
const { protect, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/tasks', asyncHandler(evaluationController.tasks));
router.get('/attempts/:id', validator.attemptDetail, validate, asyncHandler(evaluationController.attempt));
router.post('/tasks/:taskId/start', validator.startTask, validate, asyncHandler(evaluationController.startTask));
router.post('/tasks/:taskId/complete', validator.completeTask, validate, asyncHandler(evaluationController.completeTask));
router.post('/sus', validator.sus, validate, asyncHandler(evaluationController.submitSus));
router.get('/reports', requireAdmin, validator.report, validate, asyncHandler(evaluationController.report));

module.exports = router;

const express = require('express');
const { param } = require('express-validator');
const masController = require('../controllers/mas.controller');
const mamController = require('../controllers/mam.controller');
const validator = require('../validators/mas.validator');
const { validate } = require('../middleware/validate');
const { protect, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const idValidator = [param('id').isMongoId().withMessage('id must be a valid assessment identifier')];

router.use(protect, requireAdmin);

router.get('/weights', asyncHandler(mamController.weights));

router.post('/assessments', validator.createAssessment, validate, asyncHandler(masController.createAssessment));
router.get('/assessments', validator.listAssessments, validate, asyncHandler(masController.listAssessments));
router.get('/assessments/:id', idValidator, validate, asyncHandler(masController.getAssessment));
router.post('/assessments/:id/scores', [...idValidator, ...validator.scores], validate, asyncHandler(masController.saveScores));
router.post('/assessments/:id/complete', [...idValidator, ...validator.complete], validate, asyncHandler(masController.completeAssessment));
router.get('/results/latest', asyncHandler(masController.latestResult));

module.exports = router;

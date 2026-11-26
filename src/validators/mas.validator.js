const { body, query } = require('express-validator');
const { ASSESSMENT_STATUSES } = require('../constants');

const createAssessment = [
  body('assessmentName').trim().isLength({ min: 2, max: 120 }).withMessage('assessmentName must be between 2 and 120 characters'),
  body('assessedVersion').trim().isLength({ min: 1, max: 50 }).withMessage('assessedVersion is required'),
  body('assessmentNotes').optional().trim().isLength({ max: 2000 }).withMessage('assessmentNotes must not exceed 2000 characters')
];

const scores = [
  body('scores').isArray({ min: 1 }).withMessage('scores must be a non-empty array'),
  body('scores.*.criterionCode').trim().notEmpty().withMessage('criterionCode is required'),
  body('scores.*.score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('score must be between 0 and 100')
    .toFloat(),
  body('scores.*.evidence').optional().trim().isLength({ max: 2000 }).withMessage('evidence must not exceed 2000 characters')
];

const complete = [
  body('assessmentNotes').optional().trim().isLength({ max: 2000 }).withMessage('assessmentNotes must not exceed 2000 characters')
];

const listAssessments = [
  query('status').optional().isIn(Object.values(ASSESSMENT_STATUSES)).withMessage('status must be draft or completed'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
];

module.exports = { createAssessment, scores, complete, listAssessments };

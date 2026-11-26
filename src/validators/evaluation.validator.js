const { body, param, query } = require('express-validator');

const participantCode = (field = 'participantCode') =>
  body(field)
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9_-]{2,50}$/)
    .withMessage('participantCode may only contain letters, numbers, hyphens and underscores');

const startTask = [
  param('taskId').isMongoId().withMessage('taskId must be a valid identifier'),
  participantCode()
];

const completeTask = [
  param('taskId').isMongoId().withMessage('taskId must be a valid identifier'),
  body('taskEvaluationId').optional().isMongoId().withMessage('taskEvaluationId must be a valid identifier'),
  participantCode(),
  body('isSuccessful').isBoolean().withMessage('isSuccessful must be a boolean'),
  body('errorCount').optional().isInt({ min: 0, max: 1000 }).withMessage('errorCount must be a non-negative integer'),
  body('assistanceRequired').optional().isBoolean().withMessage('assistanceRequired must be a boolean'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('notes must not exceed 1000 characters')
];

const sus = [
  participantCode(),
  body('responses')
    .isArray({ min: 10, max: 10 })
    .withMessage('responses must contain exactly 10 answers'),
  body('responses.*').isInt({ min: 1, max: 5 }).withMessage('each SUS response must be an integer from 1 to 5')
];

const report = [
  query('from').optional().isISO8601().withMessage('from must be an ISO date'),
  query('to').optional().isISO8601().withMessage('to must be an ISO date'),
  query('participantCode')
    .optional()
    .matches(/^[A-Za-z0-9_-]{2,50}$/)
    .withMessage('participantCode is invalid')
];

const attemptDetail = [param('id').isMongoId().withMessage('id must be a valid task attempt identifier')];

const listAttempts = [
  ...report,
  query('taskId').optional().isMongoId().withMessage('taskId must be a valid identifier'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
];

module.exports = { startTask, completeTask, sus, report, attemptDetail, listAttempts };

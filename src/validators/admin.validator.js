const { body, param } = require('express-validator');
const { ASSESSMENT_METHODS, DIMENSION_ORDER } = require('../constants');

const dimension = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('name must be between 2 and 100 characters'),
  body('code').trim().toUpperCase().matches(/^[PCOMSA]$/).withMessage('code must be one of P, O, C, S, A'),
  body('description').trim().isLength({ min: 2, max: 1000 }).withMessage('description is required'),
  body('weight').isFloat({ gt: 0, lt: 1 }).withMessage('weight must be greater than 0 and less than 1').toFloat(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const dimensionUpdate = [
  param('code').trim().toUpperCase().matches(/^[PCOMSA]$/).withMessage('code must be one of P, O, C, S, A'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('name is invalid'),
  body('description').optional().trim().isLength({ min: 2, max: 1000 }).withMessage('description is invalid'),
  body('weight').optional().isFloat({ gt: 0, lt: 1 }).withMessage('weight must be greater than 0 and less than 1').toFloat(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const criterion = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('name must be between 2 and 150 characters'),
  body('code').trim().toUpperCase().matches(/^[A-Z0-9_-]{3,50}$/).withMessage('code is invalid'),
  body('dimensionCode').trim().toUpperCase().isIn(DIMENSION_ORDER).withMessage('dimensionCode is invalid'),
  body('description').trim().isLength({ min: 2, max: 1000 }).withMessage('description is required'),
  body('assessmentInstructions').trim().isLength({ min: 2, max: 2000 }).withMessage('assessmentInstructions are required'),
  body('assessmentMethod').isIn(ASSESSMENT_METHODS).withMessage('assessmentMethod is not supported'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const criterionUpdate = [
  param('code').trim().toUpperCase().matches(/^[A-Z0-9_-]{3,50}$/).withMessage('code is invalid'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }).withMessage('name is invalid'),
  body('dimensionCode').optional().trim().toUpperCase().isIn(DIMENSION_ORDER).withMessage('dimensionCode is invalid'),
  body('description').optional().trim().isLength({ min: 2, max: 1000 }).withMessage('description is invalid'),
  body('assessmentInstructions').optional().trim().isLength({ min: 2, max: 2000 }).withMessage('assessmentInstructions are invalid'),
  body('assessmentMethod').optional().isIn(ASSESSMENT_METHODS).withMessage('assessmentMethod is not supported'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const weights = [
  ...DIMENSION_ORDER.map((code) =>
    body(code)
      .isFloat({ min: 0, max: 1 })
      .withMessage(`${code} weight must be between 0 and 1`)
      .toFloat()
  )
];

module.exports = { dimension, dimensionUpdate, criterion, criterionUpdate, weights };

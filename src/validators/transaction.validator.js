const { body, param, query, header } = require('express-validator');
const { TRANSACTION_TYPES } = require('../constants');
const { MAX_AMOUNT_KOBO, parseNairaToKobo, resolveAmountKobo } = require('../utils/money');

const idempotencyKeyRule = (source) =>
  source('idempotencyKey')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9_-]{1,128}$/)
    .withMessage('idempotencyKey may only contain letters, numbers, hyphens and underscores');

const review = [
  body('recipientAccountNumber')
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('recipientAccountNumber must be a 10-digit account number'),
  body('amount')
    .optional()
    .custom((value) => {
      try {
        parseNairaToKobo(value);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    })
    .withMessage('amount must be a naira amount with at most two decimal places'),
  body('amountKobo')
    .optional()
    .isInt({ min: 1, max: MAX_AMOUNT_KOBO })
    .withMessage(`amountKobo must be an integer from 1 to ${MAX_AMOUNT_KOBO}`),
  body().custom((value) => {
    try {
      resolveAmountKobo(value);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }),
  body('narration').trim().isLength({ min: 1, max: 200 }).withMessage('narration must be between 1 and 200 characters'),
  idempotencyKeyRule(header),
  idempotencyKeyRule(body)
];

const confirm = [
  param('id').isMongoId().withMessage('id must be a valid transaction identifier'),
  body('confirmed')
    .isBoolean()
    .withMessage('confirmed must be a boolean set to true to process a transfer')
];

const cancel = [
  param('id').isMongoId().withMessage('id must be a valid transaction identifier'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('reason must not exceed 200 characters')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('type').optional().isIn(TRANSACTION_TYPES).withMessage('type is not a supported transaction type'),
  query('from').optional().isISO8601().withMessage('from must be an ISO date'),
  query('to').optional().isISO8601().withMessage('to must be an ISO date')
];

const detail = [param('id').isMongoId().withMessage('id must be a valid transaction identifier')];

module.exports = { review, confirm, cancel, list, detail };

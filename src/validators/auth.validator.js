const { body } = require('express-validator');

const register = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('fullName must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('email must be a valid email address').normalizeEmail(),
  body('phoneNumber')
    .trim()
    .matches(/^\+?[\d\s()-]{7,20}$/)
    .withMessage('phoneNumber must be a valid phone number'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('password must be between 8 and 128 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage('password must contain at least one letter and one number')
];

const login = [
  body('email').isEmail().withMessage('email must be a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required')
];

module.exports = { register, login };

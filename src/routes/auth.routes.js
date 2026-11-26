const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', registerLimiter, authValidator.register, validate, asyncHandler(authController.register));
router.post('/login', loginLimiter, authValidator.login, validate, asyncHandler(authController.login));
router.get('/me', protect, asyncHandler(authController.me));

module.exports = router;

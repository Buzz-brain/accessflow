const express = require('express');
const accountController = require('../controllers/account.controller');
const validator = require('../validators/transaction.validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { accountLookupLimiter } = require('../middleware/rateLimit');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/lookup/:accountNumber', accountLookupLimiter, validator.lookupRecipient, validate, asyncHandler(accountController.lookupRecipient));
router.get('/me', asyncHandler(accountController.me));
router.get('/me/balance', asyncHandler(accountController.balance));

module.exports = router;

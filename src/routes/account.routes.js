const express = require('express');
const accountController = require('../controllers/account.controller');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/me', asyncHandler(accountController.me));
router.get('/me/balance', asyncHandler(accountController.balance));

module.exports = router;

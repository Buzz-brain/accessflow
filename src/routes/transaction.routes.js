const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const validator = require('../validators/transaction.validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.post('/transfer/review', validator.review, validate, asyncHandler(transactionController.review));
router.post('/:id/confirm', validator.confirm, validate, asyncHandler(transactionController.confirm));
router.post('/:id/cancel', validator.cancel, validate, asyncHandler(transactionController.cancel));
router.get('/', validator.list, validate, asyncHandler(transactionController.list));
router.get('/:id', validator.detail, validate, asyncHandler(transactionController.detail));

module.exports = router;

const transactionService = require('../services/transaction.service');
const { sendSuccess } = require('../utils/response');

const review = async (req, res) => {
  const result = await transactionService.reviewTransfer(req.user._id, {
    ...req.body,
    idempotencyKey: req.get('Idempotency-Key') ?? req.body.idempotencyKey
  });

  const { message, accessibilityFeedback, ...data } = result;

  return sendSuccess(res, {
    message: message || 'Transfer ready for review. No funds have been moved.',
    data,
    accessibilityFeedback
  });
};

const confirm = async (req, res) => {
  try {
    const result = await transactionService.confirmTransfer(req.user._id, req.params.id, req.body);
    const { accessibilityFeedback, ...data } = result;
    return sendSuccess(res, {
      message: 'Transfer completed successfully',
      data,
      accessibilityFeedback
    });
  } catch (error) {
    error.accessibilityFeedback = transactionService.failedTransferFeedback(error.message);
    throw error;
  }
};

const cancel = async (req, res) => {
  const result = await transactionService.cancelTransfer(req.user._id, req.params.id, req.body);
  const { accessibilityFeedback, ...data } = result;

  return sendSuccess(res, {
    message: 'Transfer cancelled',
    data,
    accessibilityFeedback
  });
};

const list = async (req, res) => {
  const result = await transactionService.listTransactions(req.user._id, req.query);

  return sendSuccess(res, {
    message: 'Transactions retrieved',
    data: result.items,
    meta: result.meta
  });
};

const detail = async (req, res) => {
  const transaction = await transactionService.getTransaction(req.user._id, req.params.id);

  return sendSuccess(res, { message: 'Transaction retrieved', data: transaction });
};

module.exports = { review, confirm, cancel, list, detail };

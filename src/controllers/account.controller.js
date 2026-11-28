const accountService = require('../services/account.service');
const { sendSuccess } = require('../utils/response');

const lookupRecipient = async (req, res) => {
  const recipient = await accountService.lookupRecipient(req.params.accountNumber, req.user._id);

  return sendSuccess(res, {
    message: 'Recipient found',
    data: recipient
  });
};

const me = async (req, res) => {
  const result = await accountService.getAccountSummary(req.user._id);
  const { accessibilityFeedback, ...data } = result;

  return sendSuccess(res, {
    message: 'Account retrieved',
    data,
    accessibilityFeedback
  });
};

const balance = async (req, res) => {
  const result = await accountService.getBalance(req.user._id);
  const { accessibilityFeedback, ...data } = result;

  return sendSuccess(res, {
    message: 'Balance retrieved',
    data,
    accessibilityFeedback
  });
};

module.exports = { me, balance, lookupRecipient };

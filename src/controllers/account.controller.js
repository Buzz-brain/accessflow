const accountService = require('../services/account.service');
const { sendSuccess } = require('../utils/response');

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

module.exports = { me, balance };

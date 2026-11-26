const { Account } = require('../models');
const ApiError = require('../utils/ApiError');
const { successFeedback } = require('../utils/response');
const { formatKobo } = require('../utils/money');

const getAccountForUser = async (userId) => {
  const account = await Account.findOne({ userId });
  if (!account) throw ApiError.notFound('No simulated account was found for this user');
  return account;
};

const getAccountById = async (id) => {
  const account = await Account.findById(id);
  if (!account) throw ApiError.notFound('Account not found');
  return account;
};

const getAccountSummary = async (userId) => {
  const account = await getAccountForUser(userId);

  return {
    ...account.toClientObject(),
    accessibilityFeedback: successFeedback(
      `Your account balance is ${formatKobo(account.balanceKobo, account.currency)}. Account ${account.accountNumber} at ${account.bankName}.`,
      { priority: 'high' }
    )
  };
};

const getBalance = async (userId) => {
  const account = await getAccountForUser(userId);

  return {
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    bankName: account.bankName,
    currency: account.currency,
    balance: account.balance,
    balanceKobo: account.balanceKobo,
    accessibilityFeedback: successFeedback(
      `Your available balance is ${formatKobo(account.balanceKobo, account.currency)}.`,
      { priority: 'high' }
    )
  };
};

module.exports = { getAccountForUser, getAccountById, getAccountSummary, getBalance };

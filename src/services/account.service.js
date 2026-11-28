const { Account, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { successFeedback } = require('../utils/response');
const { formatKobo } = require('../utils/money');

const getAccountForUser = async (userId) => {
  const account = await Account.findOne({ userId });
  if (!account) throw ApiError.notFound('No bank account was found for this user');
  return account;
};

const getAccountById = async (id) => {
  const account = await Account.findById(id);
  if (!account) throw ApiError.notFound('Account not found');
  return account;
};

const getAccountSummary = async (userId) => {
  const account = await getAccountForUser(userId);

  const clientAccount = account.toClientObject();

  return {
    ...clientAccount,
    accessibilityFeedback: successFeedback(
      `Your account balance is ${formatKobo(account.balanceKobo, account.currency)}. Account ${clientAccount.accountNumber} at ${clientAccount.bankName}.`,
      { priority: 'high' }
    )
  };
};

const getBalance = async (userId) => {
  const account = await getAccountForUser(userId);
  const clientAccount = account.toClientObject();

  return {
    accountNumber: clientAccount.accountNumber,
    accountName: clientAccount.accountName,
    bankName: clientAccount.bankName,
    currency: account.currency,
    balance: account.balance,
    balanceKobo: account.balanceKobo,
    accessibilityFeedback: successFeedback(
      `Your available balance is ${formatKobo(account.balanceKobo, account.currency)}.`,
      { priority: 'high' }
    )
  };
};

const lookupRecipient = async (accountNumber, userId) => {
  const account = await Account.findOne({ accountNumber }).select('userId accountNumber accountName bankName').lean();
  if (!account) throw ApiError.notFound('Recipient account was not found', 'RECIPIENT_NOT_FOUND');

  if (account.userId.toString() === userId.toString()) {
    throw ApiError.badRequest('You cannot transfer to your own account', 'SELF_TRANSFER');
  }

  const user = await User.findById(account.userId).select('fullName isActive').lean();
  if (!user?.isActive) throw ApiError.notFound('Recipient account is currently unavailable', 'RECIPIENT_UNAVAILABLE');

  return {
    accountNumber: account.accountNumber,
    recipientName: user.fullName || Account.normalizeAccountName(account.accountName),
    bankName: Account.normalizeBankName(account.bankName)
  };
};

module.exports = { getAccountForUser, getAccountById, getAccountSummary, getBalance, lookupRecipient };

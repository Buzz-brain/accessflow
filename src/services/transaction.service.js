const crypto = require('crypto');
const { Account, Transaction, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateReference } = require('../utils/ids');
const { withRequiredTransaction } = require('../utils/transactionSession');
const { getAccountForUser } = require('./account.service');
const { getPagination, getPaginationMeta, parseDate } = require('../utils/pagination');
const { successFeedback, errorFeedback, infoFeedback } = require('../utils/response');
const { formatKobo, parseKoboAmount, resolveAmountKobo } = require('../utils/money');

const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const addHistory = (status, note) => ({ status, at: new Date(), note });

const normalizeIdempotencyKey = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const key = String(value).trim();
  if (!IDEMPOTENCY_PATTERN.test(key)) {
    throw ApiError.badRequest('idempotencyKey may only contain letters, numbers, hyphens and underscores', 'INVALID_IDEMPOTENCY_KEY');
  }
  return key;
};

const buildFingerprint = ({ recipientAccountNumber, amountKobo, narration }) =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify({ recipientAccountNumber, amountKobo, narration }))
    .digest('hex');

const findPendingTotal = async (accountId, session) => {
  const query = Transaction.find({ senderAccountId: accountId, status: 'pending_confirmation' }).select('amountKobo');
  if (session) query.session(session);
  const pending = await query.lean();
  return pending.reduce((total, item) => total + item.amountKobo, 0);
};

const createReference = async (session) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = generateReference();
    const existingQuery = Transaction.exists({ reference });
    if (session) existingQuery.session(session);
    if (!(await existingQuery)) return reference;
  }
  throw new ApiError(500, 'A unique transaction reference could not be generated', 'REFERENCE_ERROR');
};

const userDisplayName = (user, account) => user?.fullName || account.accountName;

const buildReview = async (transaction, sender, recipient, { replayed = false } = {}) => {
  const recipientUser = await User.findById(recipient.userId).select('fullName').lean();
  const senderUser = await User.findById(sender.userId).select('fullName').lean();
  const recipientName = userDisplayName(recipientUser, recipient);
  const senderName = userDisplayName(senderUser, sender);
  const isPending = transaction.status === 'pending_confirmation';

  return {
    message: isPending
      ? 'Transfer ready for review. No funds have been moved.'
      : `An existing transfer was found with status ${transaction.status}.`,
    transaction: transaction.toClientObject(),
    review: {
      recipientName,
      recipientAccountNumber: recipient.accountNumber,
      senderName,
      senderAccountNumber: sender.accountNumber,
      amount: transaction.amount,
      amountKobo: transaction.amountKobo,
      narration: transaction.narration,
      reference: transaction.reference,
      status: transaction.status,
      confirmationInstructions: isPending
        ? 'Review these details. No money has moved yet. Confirm the transfer by calling POST /api/v1/transactions/{id}/confirm with {"confirmed": true}.'
        : 'This transfer is no longer awaiting confirmation. Do not confirm it again.'
    },
    accessibilityFeedback: infoFeedback(
      isPending
        ? `Transfer review. Sending ${formatKobo(transaction.amountKobo, sender.currency)} to ${recipientName}, account ${recipient.accountNumber}. ` +
          `Reference ${transaction.reference}. No money has moved. Confirm only after you have reviewed these details.`
        : `An existing transfer with reference ${transaction.reference} has already reached ${transaction.status}. No further action is required.`,
      { priority: 'high' }
    )
  };
};

const assertRecipientAvailable = async (recipient, session) => {
  if (!recipient) throw ApiError.notFound('Recipient account was not found', 'RECIPIENT_NOT_FOUND');
  const query = User.exists({ _id: recipient.userId, isActive: true });
  if (session) query.session(session);
  const recipientUser = await query;
  if (!recipientUser) {
    throw ApiError.notFound('Recipient account is currently unavailable', 'RECIPIENT_UNAVAILABLE');
  }
};

const reviewTransfer = async (userId, payload) => {
  const amountKobo = resolveAmountKobo(payload);
  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);
  const fingerprint = idempotencyKey
    ? buildFingerprint({
        recipientAccountNumber: payload.recipientAccountNumber,
        amountKobo,
        narration: payload.narration
      })
    : null;

  const sender = await getAccountForUser(userId);
  const recipient = await Account.findOne({ accountNumber: payload.recipientAccountNumber });

  if (!recipient) throw ApiError.notFound('Recipient account was not found', 'RECIPIENT_NOT_FOUND');
  if (recipient._id.equals(sender._id)) throw ApiError.badRequest('You cannot transfer funds to your own account', 'SELF_TRANSFER_NOT_ALLOWED');
  await assertRecipientAvailable(recipient, null);

  let result;
  try {
    result = await withRequiredTransaction(async (session) => {
      const senderInSession = await Account.findById(sender._id).session(session);
      await assertRecipientAvailable(await Account.findById(recipient._id).session(session), session);

      if (idempotencyKey) {
        const existing = await Transaction.findOne({ senderAccountId: sender._id, idempotencyKey }).session(session);
        if (existing) return { document: existing, replayed: true };
      }

      const availableBalance = senderInSession.balanceKobo - (await findPendingTotal(sender._id, session));
      if (amountKobo > availableBalance) {
        throw ApiError.badRequest('Insufficient funds to review this transfer', 'INSUFFICIENT_FUNDS', {
          availableBalanceKobo: availableBalance,
          requestedAmountKobo: amountKobo
        });
      }

      const reference = await createReference(session);
      const document = await new Transaction({
        senderAccountId: sender._id,
        recipientAccountId: recipient._id,
        reference,
        transactionType: 'transfer',
        amountKobo,
        narration: payload.narration,
        status: 'pending_confirmation',
        confirmationStatus: 'pending',
        previousBalanceKobo: senderInSession.balanceKobo,
        newBalanceKobo: senderInSession.balanceKobo - amountKobo,
        idempotencyKey: idempotencyKey || undefined,
        idempotencyFingerprint: fingerprint || undefined,
        statusHistory: [
          addHistory('initiated', 'Transfer review requested'),
          addHistory('pending_confirmation', 'Awaiting explicit user confirmation')
        ]
      }).save({ session });

      return { document, replayed: false };
    });
  } catch (error) {
    if (error.code === 11000 && idempotencyKey) {
      const existing = await Transaction.findOne({ senderAccountId: sender._id, idempotencyKey });
      if (existing) return buildReview(existing, sender, recipient, { replayed: true });
    }
    throw error;
  }

  if (idempotencyKey && result.document.idempotencyFingerprint !== fingerprint) {
    throw ApiError.conflict('This idempotency key was already used for a different transfer', 'IDEMPOTENCY_KEY_REUSE', {
      idempotencyKey
    });
  }

  return buildReview(result.document, sender, recipient, { replayed: result.replayed });
};

const resolveUnclaimableTransaction = async (transaction, sender, session) => {
  if (!transaction || !transaction.senderAccountId || !transaction.senderAccountId.equals(sender._id)) {
    throw ApiError.notFound('Transaction not found');
  }

  if (['confirmed', 'processing', 'successful'].includes(transaction.status)) {
    throw ApiError.conflict('This transfer has already been confirmed and cannot be processed again', 'ALREADY_PROCESSED');
  }

  throw ApiError.conflict('This transfer is no longer awaiting confirmation', 'INVALID_TRANSACTION_STATE');
};

const applyMoneyMovement = async (transaction, session) => {
  const amountKobo = parseKoboAmount(transaction.amountKobo, 'amountKobo');

  const debited = await Account.findOneAndUpdate(
    { _id: transaction.senderAccountId, balanceKobo: { $gte: amountKobo } },
    { $inc: { balanceKobo: -amountKobo } },
    { new: true, session }
  );

  if (!debited) {
    throw ApiError.badRequest('Insufficient funds to complete this transfer', 'INSUFFICIENT_FUNDS');
  }

  const credited = await Account.updateOne(
    { _id: transaction.recipientAccountId },
    { $inc: { balanceKobo: amountKobo } },
    { session }
  );

  if (credited.matchedCount !== 1) {
    throw new ApiError(500, 'Recipient account could not be credited', 'ACCOUNT_ERROR');
  }

  return {
    previousBalanceKobo: debited.balanceKobo + amountKobo,
    newBalanceKobo: debited.balanceKobo
  };
};

const markTransferFailed = async (transactionId, error) => {
  const reason = error.isOperational ? error.message : 'The transfer could not be completed';
  try {
    await Transaction.findOneAndUpdate(
      {
        _id: transactionId,
        status: { $in: ['pending_confirmation', 'confirmed', 'processing'] }
      },
      {
        $set: { status: 'failed', failureReason: reason.slice(0, 200) },
        $push: { statusHistory: addHistory('failed', reason.slice(0, 200)) }
      }
    );
  } catch (updateError) {
    console.error('[Transfer] failed to persist failed status', updateError.message);
  }
};

const confirmTransfer = async (userId, id, { confirmed } = {}) => {
  if (confirmed !== true) {
    throw ApiError.badRequest('Explicit confirmation is required before processing a transfer', 'CONFIRMATION_REQUIRED');
  }

  const sender = await getAccountForUser(userId);
  let claimedId = null;
  let transaction;

  try {
    transaction = await withRequiredTransaction(async (session) => {
      const claimed = await Transaction.findOneAndUpdate(
        { _id: id, senderAccountId: sender._id, status: 'pending_confirmation' },
        {
          $set: { status: 'confirmed', confirmationStatus: 'confirmed', confirmedAt: new Date() },
          $push: { statusHistory: addHistory('confirmed', 'Explicit confirmation received from the account owner') }
        },
        { new: true, session }
      );

      if (!claimed) {
        const existingQuery = Transaction.findById(id).session(session);
        await resolveUnclaimableTransaction(await existingQuery.lean(), sender, session);
      }

      claimedId = claimed._id;

      const recipient = await Account.findById(claimed.recipientAccountId).session(session);
      await assertRecipientAvailable(recipient, session);

      await Transaction.updateOne(
        { _id: claimed._id },
        { $set: { status: 'processing' }, $push: { statusHistory: addHistory('processing', 'Balances are being updated atomically') } },
        { session }
      );

      const movement = await applyMoneyMovement(claimed, session);

      await Transaction.updateOne(
        { _id: claimed._id },
        {
          $set: { status: 'successful', confirmationStatus: 'confirmed', ...movement },
          $push: { statusHistory: addHistory('successful', 'Transfer completed') }
        },
        { session }
      );

      return Transaction.findById(claimed._id).session(session);
    });
  } catch (error) {
    if (claimedId) await markTransferFailed(claimedId, error);
    throw error;
  }

  const recipient = await Account.findById(transaction.recipientAccountId);
  const recipientUser = await User.findById(recipient.userId).select('fullName').lean();

  return {
    transaction: transaction.toClientObject(),
    accessibilityFeedback: successFeedback(
      `Your transfer of ${formatKobo(transaction.amountKobo, sender.currency)} to ${userDisplayName(recipientUser, recipient)} was successful. ` +
        `Reference ${transaction.reference}. Your new balance is ${formatKobo(transaction.newBalanceKobo, sender.currency)}.`,
      { priority: 'high' }
    )
  };
};

const cancelTransfer = async (userId, id, { reason } = {}) => {
  const sender = await getAccountForUser(userId);

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: id,
      senderAccountId: sender._id,
      status: 'pending_confirmation'
    },
    {
      $set: { status: 'cancelled', confirmationStatus: 'rejected' },
      $push: { statusHistory: addHistory('cancelled', reason || 'Cancelled by the account owner') }
    },
    { new: true }
  );

  if (!transaction) {
    const existing = await Transaction.findById(id);
    await resolveUnclaimableTransaction(existing, sender, null);
  }

  return {
    transaction: transaction.toClientObject(),
    accessibilityFeedback: infoFeedback(`Transfer ${transaction.reference} was cancelled. No funds were moved.`)
  };
};

const listTransactions = async (userId, query) => {
  const account = await getAccountForUser(userId);
  const pagination = getPagination(query);
  const filter = { $or: [{ senderAccountId: account._id }, { recipientAccountId: account._id }] };

  if (query.type) filter.transactionType = query.type;

  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Transaction.countDocuments(filter)
  ]);

  return {
    items: items.map((item) => ({
      ...item.toClientObject(),
      direction: item.senderAccountId && item.senderAccountId.equals(account._id) ? 'debit' : 'credit'
    })),
    meta: getPaginationMeta(pagination, total)
  };
};

const getTransaction = async (userId, id) => {
  const account = await getAccountForUser(userId);
  const transaction = await Transaction.findOne({
    _id: id,
    $or: [{ senderAccountId: account._id }, { recipientAccountId: account._id }]
  });

  if (!transaction) throw ApiError.notFound('Transaction not found');
  return transaction.toClientObject();
};

const failedTransferFeedback = (message) => errorFeedback(`Transfer failed. ${message}`, { priority: 'high' });

module.exports = {
  reviewTransfer,
  confirmTransfer,
  cancelTransfer,
  listTransactions,
  getTransaction,
  failedTransferFeedback
};

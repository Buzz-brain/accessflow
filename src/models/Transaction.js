const mongoose = require('mongoose');
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  CONFIRMATION_STATUSES
} = require('../constants');
const {
  koboToNaira,
  parseKoboAmount,
  parseNairaToKobo
} = require('../utils/money');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: TRANSACTION_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const positiveKobo = {
  type: Number,
  required: true,
  min: 1,
  validate: {
    validator: (value) => Number.isSafeInteger(value),
    message: 'Money amounts must be integer kobo'
  }
};

const optionalKobo = {
  type: Number,
  default: null,
  min: 0,
  validate: {
    validator: (value) => value === null || Number.isSafeInteger(value),
    message: 'Money amounts must be integer kobo'
  }
};

const transactionSchema = new mongoose.Schema(
  {
    senderAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    recipientAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    reference: { type: String, required: true, unique: true, trim: true },
    transactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    amountKobo: positiveKobo,
    narration: { type: String, required: true, trim: true },
    status: { type: String, enum: TRANSACTION_STATUSES, required: true, default: 'initiated' },
    confirmationStatus: {
      type: String,
      enum: CONFIRMATION_STATUSES,
      required: true,
      default: 'not_required'
    },
    previousBalanceKobo: optionalKobo,
    newBalanceKobo: optionalKobo,
    failureReason: { type: String, default: null },
    idempotencyKey: { type: String, trim: true, maxlength: 128 },
    idempotencyFingerprint: { type: String, default: null },
    confirmedAt: { type: Date, default: null },
    statusHistory: { type: [statusHistorySchema], default: [] }
  },
  { timestamps: true }
);

transactionSchema.virtual('amount')
  .get(function getAmount() {
    return koboToNaira(this.amountKobo);
  })
  .set(function setAmount(value) {
    this.amountKobo = parseNairaToKobo(value);
  });

transactionSchema.virtual('previousBalance')
  .get(function getPreviousBalance() {
    return this.previousBalanceKobo === null || this.previousBalanceKobo === undefined
      ? null
      : koboToNaira(this.previousBalanceKobo);
  })
  .set(function setPreviousBalance(value) {
    this.previousBalanceKobo = value === null || value === undefined
      ? null
      : parseNairaToKobo(value, 'previousBalance', { allowZero: true });
  });

transactionSchema.virtual('newBalance')
  .get(function getNewBalance() {
    return this.newBalanceKobo === null || this.newBalanceKobo === undefined
      ? null
      : koboToNaira(this.newBalanceKobo);
  })
  .set(function setNewBalance(value) {
    this.newBalanceKobo = value === null || value === undefined
      ? null
      : parseNairaToKobo(value, 'newBalance', { allowZero: true });
  });

transactionSchema.index({ senderAccountId: 1, createdAt: -1 });
transactionSchema.index({ recipientAccountId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index(
  { senderAccountId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

transactionSchema.methods.toClientObject = function toClientObject() {
  const amountKobo = parseKoboAmount(this.amountKobo, 'amountKobo');
  const previousBalanceKobo = this.previousBalanceKobo === null || this.previousBalanceKobo === undefined
    ? null
    : parseKoboAmount(this.previousBalanceKobo, 'previousBalanceKobo', { allowZero: true });
  const newBalanceKobo = this.newBalanceKobo === null || this.newBalanceKobo === undefined
    ? null
    : parseKoboAmount(this.newBalanceKobo, 'newBalanceKobo', { allowZero: true });

  return {
    id: this._id.toString(),
    reference: this.reference,
    transactionType: this.transactionType,
    amount: koboToNaira(amountKobo),
    amountKobo,
    narration: this.narration,
    status: this.status,
    confirmationStatus: this.confirmationStatus,
    previousBalance: previousBalanceKobo === null ? null : koboToNaira(previousBalanceKobo),
    previousBalanceKobo,
    newBalance: newBalanceKobo === null ? null : koboToNaira(newBalanceKobo),
    newBalanceKobo,
    failureReason: this.failureReason,
    confirmedAt: this.confirmedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

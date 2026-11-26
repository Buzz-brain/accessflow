const mongoose = require('mongoose');
const {
  DEFAULT_CURRENCY,
  DEFAULT_BANK_NAME,
  DEFAULT_ACCOUNT_TYPE,
  DEMO_STARTING_BALANCE_KOBO
} = require('../constants');
const { koboToNaira, parseKoboAmount, parseNairaToKobo } = require('../utils/money');

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true, default: DEFAULT_BANK_NAME },
    accountType: { type: String, enum: ['savings', 'current'], default: DEFAULT_ACCOUNT_TYPE },
    balanceKobo: {
      type: Number,
      required: true,
      default: DEMO_STARTING_BALANCE_KOBO,
      min: 0,
      validate: {
        validator: (value) => Number.isSafeInteger(value),
        message: 'balanceKobo must be an integer number of kobo'
      }
    },
    currency: { type: String, required: true, default: DEFAULT_CURRENCY, uppercase: true }
  },
  { timestamps: true }
);

accountSchema.virtual('balance')
  .get(function getBalance() {
    return koboToNaira(this.balanceKobo);
  })
  .set(function setBalance(value) {
    this.balanceKobo = parseNairaToKobo(value, 'balance', { allowZero: true });
  });

accountSchema.methods.toClientObject = function toClientObject() {
  const balanceKobo = parseKoboAmount(this.balanceKobo, 'balanceKobo', { allowZero: true });
  return {
    id: this._id.toString(),
    accountNumber: this.accountNumber,
    accountName: this.accountName,
    bankName: this.bankName,
    accountType: this.accountType,
    currency: this.currency,
    balance: koboToNaira(balanceKobo),
    balanceKobo
  };
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;

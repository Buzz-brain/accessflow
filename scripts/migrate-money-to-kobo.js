const { connectDB, disconnectDB } = require('../src/config/database');
const mongoose = require('mongoose');
const { parseNairaToKobo } = require('../src/utils/money');

const CONFIRM = 'yes';

const convert = (value, field) => {
  if (value === null || value === undefined) return null;
  return parseNairaToKobo(value, field, { allowZero: true });
};

const migrateMoney = async () => {
  if (process.env.CONFIRM_MONEY_MIGRATION !== CONFIRM) {
    console.error('Set CONFIRM_MONEY_MIGRATION=yes to migrate legacy naira Number fields to integer kobo fields.');
    process.exitCode = 1;
    return;
  }

  await connectDB();
  const db = mongoose.connection.db;
  const accounts = db.collection('accounts');
  const transactions = db.collection('transactions');

  const legacyAccounts = await accounts.find({ balanceKobo: { $exists: false }, balance: { $type: 'number' } }).toArray();
  let migratedAccounts = 0;
  for (const account of legacyAccounts) {
    const balanceKobo = convert(account.balance, 'balance');
    await accounts.updateOne(
      { _id: account._id, balanceKobo: { $exists: false } },
      { $set: { balanceKobo }, $unset: { balance: '' } }
    );
    migratedAccounts += 1;
  }

  const legacyTransactions = await transactions
    .find({
      $or: [
        { amountKobo: { $exists: false }, amount: { $type: 'number' } },
        { previousBalanceKobo: { $exists: false }, previousBalance: { $type: 'number' } },
        { newBalanceKobo: { $exists: false }, newBalance: { $type: 'number' } }
      ]
    })
    .toArray();

  let migratedTransactions = 0;
  for (const transaction of legacyTransactions) {
    const update = { $set: {}, $unset: {} };

    if (transaction.amountKobo === undefined && typeof transaction.amount === 'number') {
      update.$set.amountKobo = convert(transaction.amount, 'amount');
      update.$unset.amount = '';
    }
    if (transaction.previousBalanceKobo === undefined && typeof transaction.previousBalance === 'number') {
      update.$set.previousBalanceKobo = convert(transaction.previousBalance, 'previousBalance');
      update.$unset.previousBalance = '';
    }
    if (transaction.newBalanceKobo === undefined && typeof transaction.newBalance === 'number') {
      update.$set.newBalanceKobo = convert(transaction.newBalance, 'newBalance');
      update.$unset.newBalance = '';
    }

    if (Object.keys(update.$unset).length > 0) {
      await transactions.updateOne({ _id: transaction._id }, update);
      migratedTransactions += 1;
    }
  }

  console.log(`[Migration] accounts converted: ${migratedAccounts}`);
  console.log(`[Migration] transactions converted: ${migratedTransactions}`);
  console.log('[Migration] Existing kobo fields were not changed.');
};

migrateMoney()
  .catch((error) => {
    console.error('[Migration] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);

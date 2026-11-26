const mongoose = require('mongoose');
const ApiError = require('./ApiError');

let transactionSupport = null;

const supportsTransactions = async () => {
  if (transactionSupport === true) return true;

  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionSupport = Boolean(hello.setName || hello.primary);
  } catch (error) {
    transactionSupport = false;
  }

  return transactionSupport;
};

const withAtomicWork = async (work) => {
  if (!(await supportsTransactions())) return work(null);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const withRequiredTransaction = async (work) => {
  if (!(await supportsTransactions())) {
    throw ApiError.serviceUnavailable(
      'Banking transfers require MongoDB to run as a replica set with transaction support',
      'TRANSACTIONS_UNAVAILABLE'
    );
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const resetTransactionSupportCache = () => {
  transactionSupport = null;
};

module.exports = { supportsTransactions, withAtomicWork, withRequiredTransaction, resetTransactionSupportCache };

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { connectDB, disconnectDB } = require('../../config/database');
const { resetTransactionSupportCache } = require('../../utils/transactionSession');
require('../../models');

let replSet;

const startTestDb = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDB(replSet.getUri('accessflow_test'));
  resetTransactionSupportCache();
  return replSet;
};

const stopTestDb = async () => {
  await disconnectDB();
  if (replSet) await replSet.stop();
  replSet = null;
  resetTransactionSupportCache();
};

const clearTestDb = async () => {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
};

module.exports = { startTestDb, stopTestDb, clearTestDb };

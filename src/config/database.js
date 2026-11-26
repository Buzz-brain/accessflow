const mongoose = require('mongoose');
const env = require('./env');

const connection = mongoose.connection;

connection.on('error', (error) => {
  console.error('[MongoDB] connection error:', error.message);
});

const connectDB = async (uri = env.mongoUri) => {
  if (connection.readyState === 1) return connection;

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20
  });

  console.log(`[MongoDB] connected to ${uri.replace(/\/\/[^@]*@/, '//***@')}`);
  return connection;
};

const disconnectDB = async () => {
  if (connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB, connection };

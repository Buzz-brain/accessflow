const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`[Server] AccessFlow backend listening on port ${env.port}`);
      console.log(`[Server] API base path: ${env.apiPrefix}`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] ${signal} received. Closing connections...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

if (require.main === module) startServer();

module.exports = { startServer };

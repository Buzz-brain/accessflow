const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { sendSuccess } = require('./utils/response');

const app = express();

app.set('trust proxy', env.trustProxy ? 1 : false);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins,
    credentials: !env.corsOrigins.includes('*')
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize({ replaceWith: '_' }));

app.get('/health', (req, res) =>
  sendSuccess(res, {
    message: 'AccessFlow backend is running',
    data: { status: 'ok', environment: env.nodeEnv, version: '1.0.0' }
  })
);

app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

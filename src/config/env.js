const dotenv = require('dotenv');

dotenv.config();

const parseInteger = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const parseOriginList = (value) => {
  if (!value || value.trim() === '*') return ['*'];
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const nodeEnv = process.env.NODE_ENV || 'development';

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
}

const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'accessflow-development-secret-change-me');

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production');
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/accessflow';

if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  throw new Error('MONGODB_URI must be a valid MongoDB connection string');
}

const demoPassword = process.env.DEMO_PASSWORD || 'Demo@12345';

if (demoPassword.length < 8) {
  throw new Error('DEMO_PASSWORD must be at least 8 characters');
}

const corsOrigins = parseOriginList(process.env.CORS_ORIGIN || '*');

const env = Object.freeze({
  nodeEnv,
  port: parseInteger(process.env.PORT, 5000, { min: 1, max: 65535 }),
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInteger(process.env.BCRYPT_ROUNDS, 12, { min: 8, max: 15 }),
  corsOrigins,
  rateLimit: Object.freeze({
    windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 900000, { min: 1000 }),
    loginMax: parseInteger(process.env.LOGIN_RATE_LIMIT_MAX, 10, { min: 1 }),
    registerMax: parseInteger(process.env.REGISTER_RATE_LIMIT_MAX, 5, { min: 1 })
  }),
  demoPassword,
  trustProxy: process.env.TRUST_PROXY === 'true',
  apiPrefix: '/api/v1'
});

module.exports = env;

const request = require('supertest');
const app = require('../../app');
const bcrypt = require('bcrypt');
const { User, AccessibilityPreferences, Account } = require('../../models');
const env = require('../../config/env');
const { DEFAULT_BANK_NAME, DEFAULT_ACCOUNT_TYPE, DEFAULT_CURRENCY, DEMO_STARTING_BALANCE_KOBO } = require('../../constants');

const password = 'Test@12345';

const register = async (overrides = {}) => {
  const payload = {
    fullName: 'Test User',
    email: `user${Date.now()}${Math.random().toString(16).slice(2)}@example.com`,
    phoneNumber: '+2348012345678',
    password,
    ...overrides
  };

  const response = await request(app).post('/api/v1/auth/register').send(payload);
  expect(response.status).toBe(201);
  return { ...payload, ...response.body.data };
};

const login = async (email, suppliedPassword = password) => {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password: suppliedPassword });
  expect(response.status).toBe(200);
  return response.body.data.token;
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createAdmin = async () => {
  const email = `admin${Date.now()}${Math.random().toString(16).slice(2)}@example.com`;
  const user = await User.create({
    fullName: 'Research Administrator',
    email,
    phoneNumber: '+2348010000000',
    passwordHash: await bcrypt.hash(password, env.bcryptRounds),
    role: 'admin'
  });
  const preferences = await AccessibilityPreferences.create({ userId: user._id });
  user.accessibilityPreferences = preferences._id;
  await user.save();
  await Account.create({
    userId: user._id,
    accountNumber: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    accountName: 'Administrator AccessFlow Account',
    bankName: DEFAULT_BANK_NAME,
    accountType: DEFAULT_ACCOUNT_TYPE,
    balanceKobo: DEMO_STARTING_BALANCE_KOBO,
    currency: DEFAULT_CURRENCY
  });
  return { email, password, token: await login(email), user };
};

module.exports = { app, request, password, register, login, authHeader, createAdmin };

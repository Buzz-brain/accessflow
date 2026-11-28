const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Account, AccessibilityPreferences } = require('../models');
const env = require('../config/env');
const {
  ROLES,
  DEFAULT_BANK_NAME,
  DEFAULT_ACCOUNT_NAME_SUFFIX,
  DEFAULT_ACCOUNT_TYPE,
  DEMO_STARTING_BALANCE_KOBO,
  DEFAULT_CURRENCY
} = require('../constants');
const ApiError = require('../utils/ApiError');
const { generateAccountNumber } = require('../utils/ids');
const { withAtomicWork } = require('../utils/transactionSession');
const { successFeedback } = require('../utils/response');
const { formatKobo } = require('../utils/money');

const createBankAccount = async (user, session) => {
  let account;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      account = await new Account({
        userId: user._id,
        accountNumber: generateAccountNumber(),
        accountName: `${user.fullName} - ${DEFAULT_ACCOUNT_NAME_SUFFIX}`,
        bankName: DEFAULT_BANK_NAME,
        accountType: DEFAULT_ACCOUNT_TYPE,
        balanceKobo: DEMO_STARTING_BALANCE_KOBO,
        currency: DEFAULT_CURRENCY
      }).save({ session });
      return account;
    } catch (error) {
      if (error.code !== 11000 || attempt === 4) throw error;
    }
  }

  return account;
};

const register = async ({ fullName, email, phoneNumber, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw ApiError.conflict('An account with this email already exists', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  let user;
  let account;

  try {
    await withAtomicWork(async (session) => {
      user = await new User({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: phoneNumber.trim(),
        passwordHash,
        role: ROLES.USER,
        isActive: true
      }).save({ session });

      const preferences = await new AccessibilityPreferences({ userId: user._id }).save({ session });
      user.accessibilityPreferences = preferences._id;
      await user.save({ session });

      account = await createBankAccount(user, session);
    });
  } catch (error) {
    if (user?._id) {
      await Promise.allSettled([
        Account.deleteMany({ userId: user._id }),
        AccessibilityPreferences.deleteMany({ userId: user._id }),
        User.deleteOne({ _id: user._id })
      ]);
    }
    if (error.code === 11000) throw ApiError.conflict('An account with this email already exists', 'DUPLICATE_EMAIL');
    throw error;
  }

  return {
    user: user.toSafeObject(),
    account: account.toClientObject(),
    preferences: { voiceGuidanceEnabled: true, financialAnnouncementsEnabled: true, privacyMode: false }
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const account = await Account.findOne({ userId: user._id });
  if (!account) throw new ApiError(500, 'No bank account is linked to this user', 'CONFIGURATION_ERROR');

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: user.toSafeObject(),
    account: account.toClientObject(),
    accessibilityFeedback: successFeedback(`Welcome ${user.fullName}. You are signed in.`)
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('Account not found');

  const account = await Account.findOne({ userId });
  if (!account) throw new ApiError(500, 'No bank account is linked to this user', 'CONFIGURATION_ERROR');

  return { user: user.toSafeObject(), account: account.toClientObject() };
};

const listUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map((user) => user.toSafeObject());
};

const setUserActive = async (id, isActive) => {
  const user = await User.findByIdAndUpdate(id, { $set: { isActive } }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user.toSafeObject();
};

const registrationFeedback = (fullName, account) =>
  successFeedback(
    `Registration complete. Welcome ${fullName}. Your AccessFlow account ${account.accountNumber} has a starting balance of ${formatKobo(account.balanceKobo, account.currency)}.`,
    { priority: 'high' }
  );

module.exports = {
  register,
  login,
  getMe,
  listUsers,
  setUserActive,
  registrationFeedback
};

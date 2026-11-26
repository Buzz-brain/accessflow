const bcrypt = require('bcrypt');
const { connectDB, disconnectDB } = require('../config/database');
const env = require('../config/env');
const {
  User,
  Account,
  Transaction,
  AccessibilityPreferences,
  AccessibilityDimension,
  AccessibilityCriterion,
  EvaluationTask
} = require('../models');
const {
  DEFAULT_BANK_NAME,
  DEFAULT_ACCOUNT_TYPE,
  DEFAULT_CURRENCY,
  DEMO_STARTING_BALANCE_KOBO,
  DEMO_DEPOSIT_AMOUNT_KOBO
} = require('../constants');
const { generateAccountNumber } = require('../utils/ids');
const seedData = require('./data');

const seedDimensions = async () => {
  for (const dimension of seedData.dimensions) {
    await AccessibilityDimension.updateOne(
      { code: dimension.code },
      {
        $setOnInsert: {
          name: dimension.name,
          code: dimension.code,
          description: dimension.description,
          weight: dimension.weight,
          isActive: true,
          criteria: []
        }
      },
      { upsert: true }
    );
  }

  for (const criterion of seedData.criteria) {
    await AccessibilityCriterion.updateOne(
      { code: criterion.code },
      {
        $setOnInsert: {
          name: criterion.name,
          code: criterion.code,
          dimensionCode: criterion.dimensionCode,
          description: criterion.description,
          assessmentInstructions: criterion.assessmentInstructions,
          assessmentMethod: criterion.assessmentMethod,
          maximumScore: 100,
          isActive: true
        }
      },
      { upsert: true }
    );

    const saved = await AccessibilityCriterion.findOne({ code: criterion.code });
    await AccessibilityDimension.updateOne(
      { code: criterion.dimensionCode },
      { $addToSet: { criteria: saved._id } }
    );
  }

  console.log(`[Seed] ${seedData.dimensions.length} dimensions and ${seedData.criteria.length} criteria ready`);
};

const seedTasks = async () => {
  for (const task of seedData.tasks) {
    await EvaluationTask.updateOne(
      { taskCode: task.taskCode },
      { $setOnInsert: { ...task, isActive: true } },
      { upsert: true }
    );
  }
  console.log(`[Seed] ${seedData.tasks.length} evaluation tasks ready`);
};

const createAccount = async (user) => {
  let account = await Account.findOne({ userId: user._id });
  if (account) return account;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      account = await Account.create({
        userId: user._id,
        accountNumber: generateAccountNumber(),
        accountName: `${user.fullName} - Simulated Account`,
        bankName: DEFAULT_BANK_NAME,
        accountType: DEFAULT_ACCOUNT_TYPE,
        balanceKobo: DEMO_STARTING_BALANCE_KOBO,
        currency: DEFAULT_CURRENCY
      });
      return account;
    } catch (error) {
      if (error.code !== 11000 || attempt === 4) throw error;
    }
  }
  return account;
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(env.demoPassword, env.bcryptRounds);

  for (const demo of seedData.demoUsers) {
    let user = await User.findOne({ email: demo.email });

    if (!user) {
      user = await User.create({ ...demo, passwordHash, isActive: true });
      console.log(`[Seed] created user ${demo.email}`);
    }

    await AccessibilityPreferences.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true }
    );
    if (!user.accessibilityPreferences) {
      const preferences = await AccessibilityPreferences.findOne({ userId: user._id });
      await User.updateOne({ _id: user._id }, { $set: { accessibilityPreferences: preferences._id } });
    }

    const account = await createAccount(user);
    const reference = `SEED-DEPOSIT-${demo.email.split('@')[0].toUpperCase()}`;

    if (user.role === 'user' && !(await Transaction.exists({ reference }))) {
      await Transaction.create({
        recipientAccountId: account._id,
        reference,
        transactionType: 'deposit',
        amountKobo: DEMO_DEPOSIT_AMOUNT_KOBO,
        narration: 'Simulated demo deposit',
        status: 'successful',
        confirmationStatus: 'not_required',
        previousBalanceKobo: account.balanceKobo,
        newBalanceKobo: account.balanceKobo + DEMO_DEPOSIT_AMOUNT_KOBO,
        statusHistory: [
          { status: 'initiated', note: 'Seeded simulated deposit' },
          { status: 'successful', note: 'Seeded simulated deposit completed' }
        ]
      });
      await Account.updateOne({ _id: account._id }, { $inc: { balanceKobo: DEMO_DEPOSIT_AMOUNT_KOBO } });
    }
  }

  console.log('[Seed] demo users, preferences, accounts and sample deposits ready');
};

const seed = async () => {
  try {
    await connectDB();
    await seedDimensions();
    await seedTasks();
    await seedUsers();
    console.log('[Seed] complete. No MAS assessments or research results were created.');
  } catch (error) {
    console.error('[Seed] failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) seed();

module.exports = { seed, seedDimensions, seedTasks, seedUsers };

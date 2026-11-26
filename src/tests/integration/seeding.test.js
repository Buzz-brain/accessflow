const { startTestDb, stopTestDb } = require('../helpers/db');
const { seedDimensions, seedTasks, seedUsers } = require('../../seeders/seed');
const {
  User,
  Account,
  Transaction,
  AccessibilityDimension,
  AccessibilityCriterion,
  EvaluationTask
} = require('../../models');

describe('Seeder', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);

  test('is idempotent and seeds kobo-based demo accounts', async () => {
    await seedDimensions();
    await seedTasks();
    await seedUsers();
    await seedDimensions();
    await seedTasks();
    await seedUsers();

    expect(await AccessibilityDimension.countDocuments()).toBe(5);
    expect(await AccessibilityCriterion.countDocuments()).toBe(25);
    expect(await EvaluationTask.countDocuments()).toBe(6);
    expect(await User.countDocuments()).toBe(3);
    expect(await Account.countDocuments()).toBe(3);
    expect(await Transaction.countDocuments({ transactionType: 'deposit' })).toBe(2);

    const account = await Account.findOne({ userId: { $exists: true } });
    expect(Number.isSafeInteger(account.balanceKobo)).toBe(true);
    expect(account.balance).toBe(account.balanceKobo / 100);
  });
});

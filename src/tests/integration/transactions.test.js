const { startTestDb, stopTestDb } = require('../helpers/db');
const { app, request, register, login, authHeader } = require('../helpers/api');
const { Account, Transaction, User } = require('../../models');

const getBalance = async (token) => {
  const response = await request(app).get('/api/v1/accounts/me/balance').set(authHeader(token));
  expect(response.status).toBe(200);
  return response.body.data.balance;
};

describe('Banking API', () => {
  let sender;
  let recipient;
  let outsider;
  let senderToken;
  let recipientToken;
  let outsiderToken;

  beforeAll(async () => {
    await startTestDb();
    sender = await register({ fullName: 'Sender Test' });
    recipient = await register({ fullName: 'Recipient Test' });
    outsider = await register({ fullName: 'Outsider Test' });
    senderToken = await login(sender.email);
    recipientToken = await login(recipient.email);
    outsiderToken = await login(outsider.email);
  });

  afterAll(stopTestDb);

  test('returns account information and balance', async () => {
    const account = await request(app).get('/api/v1/accounts/me').set(authHeader(senderToken));
    expect(account.status).toBe(200);
    expect(account.body.data.accountNumber).toBe(sender.account.accountNumber);
    expect(account.body.accessibilityFeedback.type).toBe('success');

    const balance = await getBalance(senderToken);
    expect(balance).toBe(sender.account.balance);
  });

  test('requires explicit confirmation and does not move funds on review', async () => {
    const before = await getBalance(senderToken);

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 5000, narration: 'Test transfer' });

    expect(review.status).toBe(200);
    expect(review.body.data.review.recipientAccountNumber).toBe(recipient.account.accountNumber);
    expect(review.body.data.review.confirmationInstructions).toMatch(/confirm/i);
    expect(review.body.data.transaction.status).toBe('pending_confirmation');
    expect(await getBalance(senderToken)).toBe(before);

    const rejected = await request(app)
      .post(`/api/v1/transactions/${review.body.data.transaction.id}/confirm`)
      .set(authHeader(senderToken))
      .send({ confirmed: false });

    expect(rejected.status).toBe(400);
    expect(rejected.body.code).toBe('CONFIRMATION_REQUIRED');
    expect(await getBalance(senderToken)).toBe(before);
  });

  test('processes a confirmed transfer once and prevents duplicate confirmation', async () => {
    const senderBefore = await getBalance(senderToken);
    const recipientBefore = await getBalance(recipientToken);

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set({ ...authHeader(senderToken), 'Idempotency-Key': 'test-transfer-001' })
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 5000, narration: 'Verified transfer' });

    const transactionId = review.body.data.transaction.id;

    const duplicateReview = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set({ ...authHeader(senderToken), 'Idempotency-Key': 'test-transfer-001' })
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 5000, narration: 'Verified transfer' });

    expect(duplicateReview.body.data.transaction.id).toBe(transactionId);

    const confirmed = await request(app)
      .post(`/api/v1/transactions/${transactionId}/confirm`)
      .set(authHeader(senderToken))
      .send({ confirmed: true });

    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.transaction.status).toBe('successful');
    expect(confirmed.body.message).toBe('Transfer completed successfully');
    expect(confirmed.body.accessibilityFeedback.announcement).toMatch(/was successful/);
    expect(await getBalance(senderToken)).toBe(senderBefore - 5000);
    expect(await getBalance(recipientToken)).toBe(recipientBefore + 5000);

    const duplicate = await request(app)
      .post(`/api/v1/transactions/${transactionId}/confirm`)
      .set(authHeader(senderToken))
      .send({ confirmed: true });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('ALREADY_PROCESSED');
    expect(await getBalance(senderToken)).toBe(senderBefore - 5000);
    expect(await getBalance(recipientToken)).toBe(recipientBefore + 5000);
  });

  test('rejects invalid recipients and insufficient funds', async () => {
    const invalid = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: '0000000000', amount: 100, narration: 'Invalid' });
    expect(invalid.status).toBe(404);

    const self = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: sender.account.accountNumber, amount: 100, narration: 'Self' });
    expect(self.status).toBe(400);

    const tooMuch = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 100000000, narration: 'Too much' });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.code).toBe('INSUFFICIENT_FUNDS');
  });

  test('enforces transaction history ownership and supports filtering', async () => {
    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 1000, narration: 'History test' });
    const transactionId = review.body.data.transaction.id;

    const ownHistory = await request(app)
      .get('/api/v1/transactions?type=transfer&limit=10')
      .set(authHeader(senderToken));
    expect(ownHistory.status).toBe(200);
    expect(ownHistory.body.data.some((item) => item.id === transactionId)).toBe(true);

    const outsiderHistory = await request(app).get('/api/v1/transactions').set(authHeader(outsiderToken));
    expect(outsiderHistory.status).toBe(200);
    expect(outsiderHistory.body.data.some((item) => item.id === transactionId)).toBe(false);

    const outsiderDetail = await request(app).get(`/api/v1/transactions/${transactionId}`).set(authHeader(outsiderToken));
    expect(outsiderDetail.status).toBe(404);
  });

  test('cancels a pending transfer without changing balances', async () => {
    const before = await getBalance(senderToken);
    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 250, narration: 'Cancel test' });

    const response = await request(app)
      .post(`/api/v1/transactions/${review.body.data.transaction.id}/cancel`)
      .set(authHeader(senderToken))
      .send({ reason: 'Changed my mind' });

    expect(response.status).toBe(200);
    expect(response.body.data.transaction.status).toBe('cancelled');
    expect(await getBalance(senderToken)).toBe(before);

    const stored = await Transaction.findById(review.body.data.transaction.id);
    expect(stored.status).toBe('cancelled');
    const senderAccount = await Account.findById(sender.account.id);
    expect(senderAccount.balance).toBe(before);
  });

  test('moves fractional naira amounts using integer kobo', async () => {
    const senderBefore = await getBalance(senderToken);
    const recipientBefore = await getBalance(recipientToken);

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: '0.01', narration: 'Fractional transfer' });
    expect(review.status).toBe(200);
    expect(review.body.data.transaction.amountKobo).toBe(1);

    const confirmed = await request(app)
      .post(`/api/v1/transactions/${review.body.data.transaction.id}/confirm`)
      .set(authHeader(senderToken))
      .send({ confirmed: true });
    expect(confirmed.status).toBe(200);

    expect(await getBalance(senderToken)).toBeCloseTo(senderBefore - 0.01, 2);
    expect(await getBalance(recipientToken)).toBeCloseTo(recipientBefore + 0.01, 2);
  });

  test('rejects reuse of an idempotency key with different transfer details', async () => {
    const headers = { ...authHeader(senderToken), 'Idempotency-Key': 'idempotency-conflict' };

    const first = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(headers)
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 100, narration: 'Original' });
    expect(first.status).toBe(200);

    const conflict = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(headers)
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 200, narration: 'Changed' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('IDEMPOTENCY_KEY_REUSE');
  });

  test('refuses to review a transfer to an inactive recipient', async () => {
    await User.updateOne({ _id: recipient.user.id }, { $set: { isActive: false } });

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 100, narration: 'Inactive recipient' });

    await User.updateOne({ _id: recipient.user.id }, { $set: { isActive: true } });

    expect(review.status).toBe(404);
    expect(review.body.code).toBe('RECIPIENT_UNAVAILABLE');
  });

  test('processes only one of two concurrent confirmations', async () => {
    const senderBefore = await getBalance(senderToken);
    const recipientBefore = await getBalance(recipientToken);

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set({ ...authHeader(senderToken), 'Idempotency-Key': 'concurrent-confirmation' })
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 750, narration: 'Concurrent confirmation' });
    const id = review.body.data.transaction.id;

    const results = await Promise.all([
      request(app).post(`/api/v1/transactions/${id}/confirm`).set(authHeader(senderToken)).send({ confirmed: true }),
      request(app).post(`/api/v1/transactions/${id}/confirm`).set(authHeader(senderToken)).send({ confirmed: true })
    ]);

    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    expect(results.filter((result) => result.status === 409)).toHaveLength(1);
    expect(await getBalance(senderToken)).toBeCloseTo(senderBefore - 750, 2);
    expect(await getBalance(recipientToken)).toBeCloseTo(recipientBefore + 750, 2);
  });

  test('rolls back balances and records failure when money movement fails', async () => {
    const senderBefore = await getBalance(senderToken);
    const recipientBefore = await getBalance(recipientToken);

    const review = await request(app)
      .post('/api/v1/transactions/transfer/review')
      .set(authHeader(senderToken))
      .send({ recipientAccountNumber: recipient.account.accountNumber, amount: 900, narration: 'Rollback test' });
    const id = review.body.data.transaction.id;

    const creditSpy = jest.spyOn(Account, 'updateOne').mockRejectedValueOnce(new Error('forced credit failure'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failed = await request(app)
      .post(`/api/v1/transactions/${id}/confirm`)
      .set(authHeader(senderToken))
      .send({ confirmed: true });
    creditSpy.mockRestore();
    consoleSpy.mockRestore();

    expect(failed.status).toBe(500);
    expect(await getBalance(senderToken)).toBeCloseTo(senderBefore, 2);
    expect(await getBalance(recipientToken)).toBeCloseTo(recipientBefore, 2);

    const stored = await Transaction.findById(id);
    expect(stored.status).toBe('failed');
    expect(stored.failureReason).toBeDefined();
  });
});

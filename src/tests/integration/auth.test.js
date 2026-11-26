const { startTestDb, stopTestDb } = require('../helpers/db');
const { app, request, password, register, login, authHeader } = require('../helpers/api');

describe('Authentication API', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);

  test('registers a user and creates a simulated account without exposing sensitive data', async () => {
    const user = await register({ fullName: 'Vision Impaired Tester' });

    expect(user.account.accountNumber).toMatch(/^\d{10}$/);
    expect(user.account.balance).toBeGreaterThan(0);
    expect(JSON.stringify(user)).not.toContain('passwordHash');
    expect(user.preferences.voiceGuidanceEnabled).toBe(true);
  });

  test('rejects duplicate email registration', async () => {
    const user = await register();
    const response = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Duplicate User',
      email: user.email,
      phoneNumber: '+2348012345678',
      password
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('DUPLICATE_EMAIL');
  });

  test('logs in and rejects an invalid password', async () => {
    const user = await register();

    const success = await request(app).post('/api/v1/auth/login').send({ email: user.email, password });
    expect(success.status).toBe(200);
    expect(success.body.data.token).toBeDefined();
    expect(success.body.accessibilityFeedback.announce).toBe(true);
    expect(JSON.stringify(success.body)).not.toContain('passwordHash');

    const failure = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: 'Wrong@12345' });
    expect(failure.status).toBe(401);
    expect(failure.body.code).toBe('INVALID_CREDENTIALS');
    expect(failure.body.accessibilityFeedback.announce).toBe(true);
  });

  test('protects authenticated routes and returns the current user', async () => {
    const user = await register();

    const unauthenticated = await request(app).get('/api/v1/auth/me');
    expect(unauthenticated.status).toBe(401);

    const token = await login(user.email);
    const response = await request(app).get('/api/v1/auth/me').set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(user.email);
  });
});

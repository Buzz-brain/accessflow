const { startTestDb, stopTestDb } = require('../helpers/db');
const { app, request, register, login, authHeader } = require('../helpers/api');

describe('Accessibility preferences API', () => {
  let token;

  beforeAll(async () => {
    await startTestDb();
    const user = await register();
    token = await login(user.email);
  });

  afterAll(stopTestDb);

  test('returns default preferences in a React Native friendly shape', async () => {
    const response = await request(app).get('/api/v1/accessibility/preferences').set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        voiceGuidanceEnabled: true,
        voiceSpeed: 1,
        vibrationEnabled: true,
        vibrationIntensity: 50,
        gestureSensitivity: 'medium',
        privacyMode: false,
        highContrastEnabled: false,
        textScale: 1,
        simplifiedNavigation: false,
        preferredAccessibilityMode: 'balanced'
      })
    );
  });

  test('updates only the supplied preferences', async () => {
    const response = await request(app)
      .put('/api/v1/accessibility/preferences')
      .set(authHeader(token))
      .send({ voiceSpeed: 1.5, privacyMode: true, preferredAccessibilityMode: 'voice_first' });

    expect(response.status).toBe(200);
    expect(response.body.data.voiceSpeed).toBe(1.5);
    expect(response.body.data.privacyMode).toBe(true);
    expect(response.body.data.preferredAccessibilityMode).toBe('voice_first');
    expect(response.body.data.highContrastEnabled).toBe(false);

    const stored = await request(app).get('/api/v1/accessibility/preferences').set(authHeader(token));
    expect(stored.body.data.voiceSpeed).toBe(1.5);
  });

  test('rejects invalid preferences', async () => {
    const invalid = await request(app)
      .put('/api/v1/accessibility/preferences')
      .set(authHeader(token))
      .send({ voiceSpeed: 5 });
    expect(invalid.status).toBe(400);

    const empty = await request(app).put('/api/v1/accessibility/preferences').set(authHeader(token)).send({});
    expect(empty.status).toBe(400);
  });

  test('resets preferences to defaults', async () => {
    const response = await request(app).post('/api/v1/accessibility/preferences/reset').set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data.voiceSpeed).toBe(1);
    expect(response.body.data.privacyMode).toBe(false);
  });
});

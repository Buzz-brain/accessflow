const { startTestDb, stopTestDb } = require('../helpers/db');
const { app, request, register, login, authHeader, createAdmin } = require('../helpers/api');
const { seedDimensions } = require('../../seeders/seed');
const { AccessibilityCriterion, AccessibilityDimension } = require('../../models');
const { DEFAULT_WEIGHTS } = require('../../constants');

const targetScores = { P: 66.7, O: 50, C: 100, S: 50, A: 100 };

describe('MAM and MAS API', () => {
  let admin;
  let userToken;

  beforeAll(async () => {
    await startTestDb();
    await seedDimensions();
    admin = await createAdmin();
    const user = await register();
    userToken = await login(user.email);
  });

  afterAll(stopTestDb);

  test('exposes five dimensions, their criteria and the initial weights', async () => {
    const dimensions = await request(app).get('/api/v1/mam/dimensions').set(authHeader(userToken));
    expect(dimensions.status).toBe(200);
    expect(dimensions.body.data).toHaveLength(5);
    expect(dimensions.body.data.find((item) => item.code === 'S').weight).toBe(0.25);

    const criteria = await request(app).get('/api/v1/mam/criteria').set(authHeader(userToken));
    expect(criteria.status).toBe(200);
    expect(criteria.body.data).toHaveLength(25);

    const weights = await request(app).get('/api/v1/mas/weights').set(authHeader(admin.token));
    expect(weights.status).toBe(200);
    expect(weights.body.data).toEqual(DEFAULT_WEIGHTS);
  });

  test('restricts assessment creation to administrators', async () => {
    const forbidden = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(userToken))
      .send({ assessmentName: 'Unauthorized', assessedVersion: 'v1' });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'Methodology verification', assessedVersion: 'v1' });
    expect(allowed.status).toBe(201);
    expect(allowed.body.data.assessmentStatus).toBe('draft');
    expect(allowed.body.data.weightsUsed).toEqual(DEFAULT_WEIGHTS);
    expect(allowed.body.data.criteriaSnapshot).toHaveLength(25);
    expect(allowed.body.data.dimensionsSnapshot).toHaveLength(5);
  });

  test('rejects incomplete final assessments and invalid criterion scores', async () => {
    const created = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'Incomplete assessment', assessedVersion: 'v1' });
    const assessmentId = created.body.data.id;

    const invalid = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/scores`)
      .set(authHeader(admin.token))
      .send({ scores: [{ criterionCode: 'P01', score: 120 }] });
    expect(invalid.status).toBe(400);

    const incomplete = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/complete`)
      .set(authHeader(admin.token))
      .send({});
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.code).toBe('ASSESSMENT_INCOMPLETE');

    const stored = await request(app).get(`/api/v1/mas/assessments/${assessmentId}`).set(authHeader(admin.token));
    expect(stored.body.data.assessmentStatus).toBe('draft');
    expect(stored.body.data.overallMAS).toBeNull();
  });

  test('calculates the illustrative MAS of approximately 70.84 when complete', async () => {
    const criteria = await AccessibilityCriterion.find().lean();
    const created = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'Illustrative calculation', assessedVersion: 'v1' });
    const assessmentId = created.body.data.id;

    const scores = criteria.map((criterion) => ({
      criterionCode: criterion.code,
      score: targetScores[criterion.dimensionCode],
      evidence: `Evidence recorded for ${criterion.code} using ${criterion.assessmentMethod}`
    }));

    const saved = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/scores`)
      .set(authHeader(admin.token))
      .send({ scores });
    expect(saved.status).toBe(200);
    expect(saved.body.data.isComplete).toBe(true);

    const completed = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/complete`)
      .set(authHeader(admin.token))
      .send({ assessmentNotes: 'Verified against the research illustration' });

    expect(completed.status).toBe(200);
    expect(completed.body.data.assessmentStatus).toBe('completed');
    expect(completed.body.data.overallMAS).toBeCloseTo(70.84, 2);
    expect(completed.body.data.dimensionScores.find((item) => item.code === 'P').score).toBeCloseTo(66.7, 5);
    expect(completed.body.data.highestDimension.code).toBe('C');
    expect(completed.body.data.completedAt).toBeDefined();
  });

  test('preserves historical weights when administrative weights change', async () => {
    const criteria = await AccessibilityCriterion.find().lean();

    const created = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'Historical weights', assessedVersion: 'v1' });
    const assessmentId = created.body.data.id;

    await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/scores`)
      .set(authHeader(admin.token))
      .send({ scores: criteria.map((criterion) => ({ criterionCode: criterion.code, score: targetScores[criterion.dimensionCode] })) });

    const completed = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/complete`)
      .set(authHeader(admin.token))
      .send({});
    expect(completed.status).toBe(200);
    const originalMas = completed.body.data.overallMAS;

    const updated = await request(app)
      .put('/api/v1/admin/mas/weights')
      .set(authHeader(admin.token))
      .send({ P: 0.3, O: 0.15, C: 0.15, S: 0.25, A: 0.15 });
    expect(updated.status).toBe(200);

    const historical = await request(app).get(`/api/v1/mas/assessments/${assessmentId}`).set(authHeader(admin.token));
    expect(historical.body.data.weightsUsed).toEqual(DEFAULT_WEIGHTS);
    expect(historical.body.data.overallMAS).toBeCloseTo(originalMas, 5);

    const next = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'New weights assessment', assessedVersion: 'v1' });
    expect(next.body.data.weightsUsed).toEqual({ P: 0.3, O: 0.15, C: 0.15, S: 0.25, A: 0.15 });

    const latest = await request(app).get('/api/v1/mas/results/latest').set(authHeader(admin.token));
    expect(latest.status).toBe(200);
    expect(latest.body.data.assessmentStatus).toBe('completed');

    for (const [code, weight] of Object.entries(DEFAULT_WEIGHTS)) {
      await AccessibilityDimension.updateOne({ code }, { $set: { weight } });
    }
  });

  test('restricts all assessment data and framework weights to administrators', async () => {
    const weights = await request(app).get('/api/v1/mas/weights').set(authHeader(userToken));
    expect(weights.status).toBe(403);

    const list = await request(app).get('/api/v1/mas/assessments').set(authHeader(userToken));
    expect(list.status).toBe(403);

    const latest = await request(app).get('/api/v1/mas/results/latest').set(authHeader(userToken));
    expect(latest.status).toBe(403);
  });

  test('scores against the saved criteria snapshot after framework definitions change', async () => {
    const criteria = await AccessibilityCriterion.find().lean();

    const created = await request(app)
      .post('/api/v1/mas/assessments')
      .set(authHeader(admin.token))
      .send({ assessmentName: 'Snapshot verification', assessedVersion: 'v1' });
    const assessmentId = created.body.data.id;

    const original = await AccessibilityCriterion.findOne({ code: 'P01' });
    await AccessibilityCriterion.updateOne({ code: 'P01' }, { $set: { name: 'Changed after assessment', isActive: false } });

    const saved = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/scores`)
      .set(authHeader(admin.token))
      .send({ scores: criteria.map((criterion) => ({ criterionCode: criterion.code, score: targetScores[criterion.dimensionCode] })) });
    expect(saved.status).toBe(200);

    const completed = await request(app)
      .post(`/api/v1/mas/assessments/${assessmentId}/complete`)
      .set(authHeader(admin.token))
      .send({});
    expect(completed.status).toBe(200);
    expect(completed.body.data.overallMAS).toBeCloseTo(70.84, 2);

    await AccessibilityCriterion.updateOne(
      { code: 'P01' },
      { $set: { name: original.name, isActive: original.isActive } }
    );
  });
});

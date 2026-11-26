const { startTestDb, stopTestDb } = require('../helpers/db');
const { app, request, register, login, authHeader, createAdmin } = require('../helpers/api');
const { seedTasks } = require('../../seeders/seed');
const { EvaluationTask, TaskEvaluation } = require('../../models');

describe('Research evaluation API', () => {
  let userToken;
  let admin;
  let loginTask;

  beforeAll(async () => {
    await startTestDb();
    await seedTasks();
    const user = await register();
    userToken = await login(user.email);
    admin = await createAdmin();
    loginTask = await EvaluationTask.findOne({ taskCode: 'USER_LOGIN' });
  });

  afterAll(stopTestDb);

  test('exposes the six research task definitions', async () => {
    const response = await request(app).get('/api/v1/evaluation/tasks').set(authHeader(userToken));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(6);
    expect(response.body.data.map((item) => item.taskCode)).toContain('REVIEW_CONFIRM_TRANSACTION');
  });

  test('records a task attempt as started and completed', async () => {
    const started = await request(app)
      .post(`/api/v1/evaluation/tasks/${loginTask._id}/start`)
      .set(authHeader(userToken))
      .send({ participantCode: 'P-API' });
    expect(started.status).toBe(201);
    expect(started.body.data.status).toBe('in_progress');

    const completed = await request(app)
      .post(`/api/v1/evaluation/tasks/${loginTask._id}/complete`)
      .set(authHeader(userToken))
      .send({
        taskEvaluationId: started.body.data.id,
        participantCode: 'P-API',
        isSuccessful: true,
        errorCount: 0,
        assistanceRequired: false
      });

    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe('completed');
    expect(completed.body.data.completionTimeSeconds).toBeGreaterThanOrEqual(0);
    expect(completed.body.data.isSuccessful).toBe(true);
  });

  test('stores a standard SUS submission with the correct score', async () => {
    const response = await request(app)
      .post('/api/v1/evaluation/sus')
      .set(authHeader(userToken))
      .send({
        participantCode: 'P-API',
        responses: [5, 1, 3, 2, 4, 1, 5, 2, 4, 3]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.questionScores).toEqual([4, 4, 2, 3, 3, 4, 4, 3, 3, 2]);
    expect(response.body.data.totalSusScore).toBe(80);
  });

  test('reports task success rate, completion time and SUS without fabricated MAS results', async () => {
    const reportUser = await register();
    const reportToken = await login(reportUser.email);

    const sus = await request(app)
      .post('/api/v1/evaluation/sus')
      .set(authHeader(reportToken))
      .send({
        participantCode: 'P-REPORT',
        responses: [5, 1, 3, 2, 4, 1, 5, 2, 4, 3]
      });
    expect(sus.status).toBe(201);

    await TaskEvaluation.create([
      { participantCode: 'P-REPORT', ownerUserId: reportUser.user.id, taskId: loginTask._id, startedAt: new Date(), completionTimeSeconds: 30, isSuccessful: true, status: 'completed' },
      { participantCode: 'P-REPORT', ownerUserId: reportUser.user.id, taskId: loginTask._id, startedAt: new Date(), completionTimeSeconds: 60, isSuccessful: true, status: 'completed' },
      { participantCode: 'P-REPORT', ownerUserId: reportUser.user.id, taskId: loginTask._id, startedAt: new Date(), completionTimeSeconds: 120, isSuccessful: false, status: 'completed' },
      { participantCode: 'P-REPORT', ownerUserId: reportUser.user.id, taskId: loginTask._id, startedAt: new Date(), completionTimeSeconds: 200, isSuccessful: false, status: 'completed' }
    ]);

    const response = await request(app)
      .get('/api/v1/evaluation/reports?participantCode=P-REPORT')
      .set(authHeader(admin.token));

    expect(response.status).toBe(200);
    expect(response.body.data.taskMetrics.totalAttempts).toBe(4);
    expect(response.body.data.taskMetrics.successfulAttempts).toBe(2);
    expect(response.body.data.taskMetrics.unsuccessfulAttempts).toBe(2);
    expect(response.body.data.taskMetrics.taskSuccessRate).toBe(50);
    expect(response.body.data.taskMetrics.averageCompletionTimeSeconds).toBe(45);
    expect(response.body.data.taskMetrics.timedAttemptsIncluded).toBe(2);
    expect(response.body.data.sus.averageScore).toBe(80);
    expect(response.body.data.participants.count).toBe(1);
    expect(response.body.data.mas.overallMAS).toBeNull();
  });

  test('keeps task attempts private to the owner and administrator', async () => {
    const secondUser = await register();
    const secondToken = await login(secondUser.email);

    const started = await request(app)
      .post(`/api/v1/evaluation/tasks/${loginTask._id}/start`)
      .set(authHeader(secondToken))
      .send({ participantCode: 'P-SECOND' });
    expect(started.status).toBe(201);

    const attemptId = started.body.data.id;
    const ownerRead = await request(app).get(`/api/v1/evaluation/attempts/${attemptId}`).set(authHeader(secondToken));
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.body.data.participantCode).toBe('P-SECOND');

    const otherUserRead = await request(app).get(`/api/v1/evaluation/attempts/${attemptId}`).set(authHeader(userToken));
    expect(otherUserRead.status).toBe(404);

    const adminRead = await request(app)
      .get(`/api/v1/admin/evaluation/attempts/${attemptId}`)
      .set(authHeader(admin.token));
    expect(adminRead.status).toBe(200);

    const crossUserCompletion = await request(app)
      .post(`/api/v1/evaluation/tasks/${loginTask._id}/complete`)
      .set(authHeader(userToken))
      .send({
        taskEvaluationId: attemptId,
        participantCode: 'P-API',
        isSuccessful: true,
        errorCount: 0
      });
    expect(crossUserCompletion.status).toBe(404);

    const reusedCode = await request(app)
      .post(`/api/v1/evaluation/tasks/${loginTask._id}/start`)
      .set(authHeader(userToken))
      .send({ participantCode: 'P-SECOND' });
    expect(reusedCode.status).toBe(409);
    expect(reusedCode.body.code).toBe('PARTICIPANT_CODE_MISMATCH');
  });

  test('requires admin access for evaluation reports', async () => {
    const response = await request(app).get('/api/v1/evaluation/reports').set(authHeader(userToken));
    expect(response.status).toBe(403);
  });
});

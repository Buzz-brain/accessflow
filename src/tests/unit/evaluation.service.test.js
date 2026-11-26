const { getTaskMetricsFromRecords } = require('../../services/evaluation.service');

describe('Task evaluation metrics', () => {
  test('calculates success rate and average time using successful attempts only', () => {
    const records = [
      { isSuccessful: true, completionTimeSeconds: 30 },
      { isSuccessful: true, completionTimeSeconds: 60 },
      { isSuccessful: false, completionTimeSeconds: 120 },
      { isSuccessful: false, completionTimeSeconds: 200 }
    ];

    const metrics = getTaskMetricsFromRecords(records);

    expect(metrics.totalAttempts).toBe(4);
    expect(metrics.successfulAttempts).toBe(2);
    expect(metrics.unsuccessfulAttempts).toBe(2);
    expect(metrics.taskSuccessRate).toBe(50);
    expect(metrics.averageCompletionTimeSeconds).toBe(45);
    expect(metrics.timedAttemptsIncluded).toBe(2);
  });

  test('returns null rates and averages when no valid attempts exist', () => {
    const metrics = getTaskMetricsFromRecords([]);
    expect(metrics.taskSuccessRate).toBeNull();
    expect(metrics.averageCompletionTimeSeconds).toBeNull();
    expect(metrics.timedAttemptsIncluded).toBe(0);
  });
});

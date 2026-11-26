const {
  KOBO_PER_NAIRA,
  MAX_AMOUNT_KOBO,
  parseKoboAmount,
  parseNairaToKobo,
  resolveAmountKobo,
  koboToNaira,
  moneyObject,
  formatKobo
} = require('../../utils/money');

describe('money utilities', () => {
  test('converts naira amounts without floating point drift', () => {
    expect(KOBO_PER_NAIRA).toBe(100);
    expect(parseNairaToKobo('0.01')).toBe(1);
    expect(parseNairaToKobo('10.70')).toBe(1070);
    expect(parseNairaToKobo(25)).toBe(2500);
    expect(parseNairaToKobo('0', 'balance', { allowZero: true })).toBe(0);
  });

  test('rejects more than two decimal places and unsupported ranges', () => {
    expect(() => parseNairaToKobo('1.001')).toThrow(expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' }));
    expect(() => parseNairaToKobo('0.001')).toThrow(expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' }));
    expect(() => parseNairaToKobo(String(MAX_AMOUNT_KOBO / 100 + 1))).toThrow(
      expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' })
    );
    expect(() => parseKoboAmount(1.5)).toThrow(expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' }));
    expect(() => parseKoboAmount(0)).toThrow(expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' }));
  });

  test('resolves naira and kobo inputs and rejects conflicts', () => {
    expect(resolveAmountKobo({ amount: '12.34' })).toBe(1234);
    expect(resolveAmountKobo({ amountKobo: 1234 })).toBe(1234);
    expect(resolveAmountKobo({ amount: '12.34', amountKobo: 1234 })).toBe(1234);
    expect(() => resolveAmountKobo({ amount: '12.34', amountKobo: 1235 })).toThrow(
      expect.objectContaining({ code: 'AMOUNT_REPRESENTATION_MISMATCH' })
    );
    expect(() => resolveAmountKobo({})).toThrow(expect.objectContaining({ code: 'INVALID_MONEY_AMOUNT' }));
  });

  test('exposes naira compatibility fields derived from kobo', () => {
    expect(koboToNaira(1070)).toBe(10.7);
    expect(moneyObject(1)).toEqual({ amount: 0.01, amountKobo: 1, currency: 'NGN' });
    expect(formatKobo(250)).toBe('2.5 naira (NGN)');
  });
});

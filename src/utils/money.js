const ApiError = require('./ApiError');

const KOBO_PER_NAIRA = 100;
const MAX_AMOUNT_KOBO = 100000000000;
const NAIRA_DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;

const parseKoboAmount = (value, field = 'amountKobo', { allowZero = false } = {}) => {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value.trim()) : value;

  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > MAX_AMOUNT_KOBO || (!allowZero && parsed === 0)) {
    throw ApiError.badRequest(`${field} must be a positive integer amount in kobo`, 'INVALID_MONEY_AMOUNT', {
      field,
      maxKobo: MAX_AMOUNT_KOBO
    });
  }

  return parsed;
};

const parseNairaToKobo = (value, field = 'amount', { allowZero = false } = {}) => {
  const raw = typeof value === 'string' ? value.trim() : value;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw ApiError.badRequest(`${field} must be a finite decimal naira amount`, 'INVALID_MONEY_AMOUNT', { field });
    }
  }

  const text = String(raw);
  if (!NAIRA_DECIMAL_PATTERN.test(text)) {
    throw ApiError.badRequest(`${field} must be a naira amount with at most two decimal places`, 'INVALID_MONEY_AMOUNT', {
      field,
      expected: 'positive number or string with at most two decimal places'
    });
  }

  const [naira, fraction = ''] = text.split('.');
  const kobo = Number(naira) * KOBO_PER_NAIRA + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(kobo) || kobo < 0 || kobo > MAX_AMOUNT_KOBO || (!allowZero && kobo === 0)) {
    throw ApiError.badRequest(`${field} is outside the supported money range`, 'INVALID_MONEY_AMOUNT', {
      field,
      maxNaira: MAX_AMOUNT_KOBO / KOBO_PER_NAIRA
    });
  }

  return kobo;
};

const resolveAmountKobo = (payload = {}) => {
  const hasNaira = payload.amount !== undefined && payload.amount !== null && payload.amount !== '';
  const hasKobo = payload.amountKobo !== undefined && payload.amountKobo !== null && payload.amountKobo !== '';

  if (!hasNaira && !hasKobo) {
    throw ApiError.badRequest('An amount is required', 'INVALID_MONEY_AMOUNT', { expected: 'amount or amountKobo' });
  }

  if (hasNaira && hasKobo) {
    const fromNaira = parseNairaToKobo(payload.amount);
    const fromKobo = parseKoboAmount(payload.amountKobo);
    if (fromNaira !== fromKobo) {
      throw ApiError.badRequest('amount and amountKobo represent different values', 'AMOUNT_REPRESENTATION_MISMATCH', {
        amountKoboFromNaira: fromNaira,
        amountKobo: fromKobo
      });
    }
    return fromKobo;
  }

  return hasKobo ? parseKoboAmount(payload.amountKobo) : parseNairaToKobo(payload.amount);
};

const koboToNaira = (kobo) => parseKoboAmount(kobo, 'kobo', { allowZero: true }) / KOBO_PER_NAIRA;

const moneyObject = (kobo, currency = 'NGN') => ({
  amount: koboToNaira(kobo),
  amountKobo: parseKoboAmount(kobo, 'kobo', { allowZero: true }),
  currency
});

const formatKobo = (kobo, currency = 'NGN') => {
  const amount = koboToNaira(kobo);
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `${formatted} naira (${currency})`;
};

module.exports = {
  KOBO_PER_NAIRA,
  MAX_AMOUNT_KOBO,
  parseKoboAmount,
  parseNairaToKobo,
  resolveAmountKobo,
  koboToNaira,
  moneyObject,
  formatKobo
};

const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin'
});

const DIMENSION_CODES = Object.freeze({
  PERCEPTUAL: 'P',
  OPERATIONAL: 'O',
  COGNITIVE: 'C',
  SECURITY: 'S',
  ASSISTIVE: 'A'
});

const DIMENSION_ORDER = Object.freeze(['P', 'O', 'C', 'S', 'A']);

const DIMENSION_NAMES = Object.freeze({
  P: 'Perceptual',
  O: 'Operational',
  C: 'Cognitive',
  S: 'Security',
  A: 'Assistive Technology Integration'
});

const DEFAULT_WEIGHTS = Object.freeze({
  P: 0.2,
  O: 0.2,
  C: 0.2,
  S: 0.25,
  A: 0.15
});

const TRANSACTION_TYPES = Object.freeze(['transfer', 'deposit', 'withdrawal']);

const TRANSACTION_STATUSES = Object.freeze([
  'initiated',
  'pending_confirmation',
  'confirmed',
  'processing',
  'successful',
  'failed',
  'cancelled'
]);

const CONFIRMATION_STATUSES = Object.freeze([
  'not_required',
  'pending',
  'confirmed',
  'rejected'
]);

const ASSESSMENT_METHODS = Object.freeze([
  'automated',
  'manual',
  'userTesting',
  'assistiveTechnologyTesting'
]);

const ASSESSMENT_STATUSES = Object.freeze({ DRAFT: 'draft', COMPLETED: 'completed' });

const GESTURE_SENSITIVITY = Object.freeze(['low', 'medium', 'high']);

const ACCESSIBILITY_MODES = Object.freeze([
  'balanced',
  'voice_first',
  'vibration_first',
  'high_contrast',
  'simplified'
]);

const LOW_SCORE_THRESHOLD = 60;

const DEFAULT_CURRENCY = 'NGN';
const DEFAULT_BANK_NAME = 'AccessFlow Simulated Bank';
const DEFAULT_ACCOUNT_TYPE = 'savings';
const KOBO_PER_NAIRA = 100;
const DEMO_STARTING_BALANCE = 250000;
const DEMO_STARTING_BALANCE_KOBO = DEMO_STARTING_BALANCE * KOBO_PER_NAIRA;
const DEMO_DEPOSIT_AMOUNT_KOBO = 50000 * KOBO_PER_NAIRA;

const EVALUATION_TASK_CODES = Object.freeze([
  'USER_LOGIN',
  'VIEW_BALANCE',
  'VIEW_TRANSACTIONS',
  'TRANSFER_FUNDS',
  'REVIEW_CONFIRM_TRANSACTION',
  'UPDATE_ACCESSIBILITY'
]);

const SUS_QUESTIONS = Object.freeze([
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to be able to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.'
]);

module.exports = {
  ROLES,
  DIMENSION_CODES,
  DIMENSION_ORDER,
  DIMENSION_NAMES,
  DEFAULT_WEIGHTS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  CONFIRMATION_STATUSES,
  ASSESSMENT_METHODS,
  ASSESSMENT_STATUSES,
  GESTURE_SENSITIVITY,
  ACCESSIBILITY_MODES,
  LOW_SCORE_THRESHOLD,
  DEFAULT_CURRENCY,
  DEFAULT_BANK_NAME,
  DEFAULT_ACCOUNT_TYPE,
  KOBO_PER_NAIRA,
  DEMO_STARTING_BALANCE,
  DEMO_STARTING_BALANCE_KOBO,
  DEMO_DEPOSIT_AMOUNT_KOBO,
  EVALUATION_TASK_CODES,
  SUS_QUESTIONS
};

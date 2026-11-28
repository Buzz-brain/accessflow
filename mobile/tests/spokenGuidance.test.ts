import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildScreenGuidance,
  formatAccountNumberForSpeech,
  formatKoboForSpeech,
  numberToWords,
  resolveGuidance
} from '../src/services/feedback/spokenGuidance.ts';

const policy = {
  voiceGuidanceEnabled: true,
  financialAnnouncementsEnabled: true,
  privacyMode: false,
  voiceSpeed: 1,
  screenReaderEnabled: false
};

test('formats naira amounts as speakable words', () => {
  assert.equal(numberToWords(0), 'zero');
  assert.equal(numberToWords(12345), 'twelve thousand three hundred forty five');
  assert.equal(formatKoboForSpeech(2500050), 'twenty five thousand naira and fifty kobo');
  assert.equal(formatKoboForSpeech(0), 'zero naira');
});

test('formats account numbers digit by digit', () => {
  assert.equal(formatAccountNumberForSpeech('0123456789'), '0 1 2 3 4 5 6 7 8 9');
});

test('builds screen entry guidance with a primary action', () => {
  assert.equal(
    buildScreenGuidance('Transfer', 'Send money to another account.', 'Continue'),
    'Transfer. Send money to another account. Primary action: Continue.'
  );
});

test('uses native announcements only when a screen reader is active', () => {
  const decision = resolveGuidance({ message: 'Transfer started' }, { ...policy, screenReaderEnabled: true }, null, 1000);

  assert.equal(decision.shouldAnnounce, true);
  assert.equal(decision.useScreenReader, true);
  assert.equal(decision.useSpeech, false);
});

test('uses app speech when no screen reader is active', () => {
  const decision = resolveGuidance({ message: 'Transfer started' }, policy, null, 1000);

  assert.equal(decision.shouldAnnounce, true);
  assert.equal(decision.useScreenReader, false);
  assert.equal(decision.useSpeech, true);
});

test('hides sensitive financial details in privacy mode', () => {
  const decision = resolveGuidance(
    { message: 'Balance is ₦25,000', kind: 'financial' },
    { ...policy, privacyMode: true },
    null,
    1000
  );

  assert.equal(decision.text, 'Sensitive information hidden.');
  assert.equal(decision.shouldAnnounce, true);
});

test('suppresses financial guidance when the setting is off', () => {
  const decision = resolveGuidance(
    { message: 'Balance is ₦25,000', kind: 'financial' },
    { ...policy, financialAnnouncementsEnabled: false },
    null,
    1000
  );

  assert.equal(decision.shouldAnnounce, false);
});

test('suppresses duplicate guidance unless forced or high priority', () => {
  const last = { key: 'validation:amount', at: 1000 };

  assert.equal(
    resolveGuidance({ message: 'Amount is required', key: 'validation:amount' }, policy, last, 1500).shouldAnnounce,
    false
  );
  assert.equal(
    resolveGuidance({ message: 'Amount is required', key: 'validation:amount', force: true }, policy, last, 1500)
      .shouldAnnounce,
    true
  );
  assert.equal(
    resolveGuidance({ message: 'Amount is required', key: 'validation:amount', highPriority: true }, policy, last, 1500)
      .shouldAnnounce,
    true
  );
});

test('clamps speech rate to the supported range', () => {
  assert.equal(resolveGuidance({ message: 'Hello' }, { ...policy, voiceSpeed: 5 }, null, 1000).rate, 2);
  assert.equal(resolveGuidance({ message: 'Hello' }, { ...policy, voiceSpeed: 0 }, null, 1000).rate, 0.5);
});

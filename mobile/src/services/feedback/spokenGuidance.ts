export type GuidanceKind =
  | 'general'
  | 'navigation'
  | 'validation'
  | 'progress'
  | 'financial'
  | 'result'
  | 'sensitive';

export type GuidanceHaptic = 'success' | 'error' | 'warning' | 'selection';

export interface GuidancePolicy {
  voiceGuidanceEnabled: boolean;
  financialAnnouncementsEnabled: boolean;
  privacyMode: boolean;
  voiceSpeed: number;
  screenReaderEnabled: boolean;
}

export interface GuidanceRequest {
  message: string;
  kind?: GuidanceKind;
  financial?: boolean;
  sensitive?: boolean;
  highPriority?: boolean;
  force?: boolean;
  key?: string;
  haptic?: GuidanceHaptic;
  forceSpeech?: boolean;
}

export interface GuidanceDecision {
  shouldAnnounce: boolean;
  text: string;
  useScreenReader: boolean;
  useSpeech: boolean;
  rate: number;
  haptic?: GuidanceHaptic;
  dedupeKey: string;
  debounceMs: number;
}

export interface LastAnnouncement {
  key: string;
  at: number;
}

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen'
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];

const belowThousand = (value: number): string => {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`);

  const remainder = value % 100;
  if (remainder < 20) {
    if (remainder > 0 || parts.length === 0) parts.push(ONES[remainder] ?? String(remainder));
    return parts.join(' ');
  }

  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;
  parts.push(ones === 0 ? TENS[tens] ?? String(remainder) : `${TENS[tens]} ${ONES[ones]}`);
  return parts.join(' ');
};

export function numberToWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) return String(value);
  const rounded = Math.floor(value);
  if (rounded === 0) return 'zero';

  const groups: number[] = [];
  let remaining = rounded;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (!group) continue;
    const scale = SCALES[index] ?? '';
    parts.push(scale ? `${belowThousand(group)} ${scale}` : belowThousand(group));
  }
  return parts.join(' ');
}

export function formatKoboForSpeech(kobo: number, currency = 'NGN'): string {
  if (!Number.isFinite(kobo) || kobo < 0) return 'an invalid amount';
  if (currency !== 'NGN') return `${new Intl.NumberFormat('en-NG').format(kobo / 100)} ${currency}`;

  const naira = Math.floor(kobo / 100);
  const remainder = kobo % 100;
  const parts: string[] = [];
  if (naira > 0) parts.push(`${numberToWords(naira)} naira`);
  if (remainder > 0) parts.push(`${numberToWords(remainder)} kobo`);
  return parts.length > 0 ? parts.join(' and ') : 'zero naira';
}

export function formatAccountNumberForSpeech(accountNumber: string): string {
  return accountNumber.replace(/\D/g, '').split('').join(' ');
}

export function buildScreenGuidance(title: string, purpose: string, primaryAction?: string): string {
  return `${title}. ${purpose}${primaryAction ? ` Primary action: ${primaryAction}.` : ''}`;
}

export function resolveGuidance(
  request: GuidanceRequest,
  policy: GuidancePolicy,
  last: LastAnnouncement | null,
  now: number
): GuidanceDecision {
  const message = request.message.trim();
  const financial = request.financial || request.kind === 'financial';
  const sensitive = request.sensitive || request.kind === 'sensitive' || (financial && policy.privacyMode);
  const text = sensitive && policy.privacyMode ? 'Sensitive information hidden.' : message;
  const dedupeKey = request.key || text;
  const debounceMs = request.highPriority ? 0 : request.kind === 'navigation' ? 900 : 1200;
  const blocked =
    !message ||
    !policy.voiceGuidanceEnabled ||
    (financial && !policy.financialAnnouncementsEnabled) ||
    Boolean(last && last.key === dedupeKey && now - last.at < debounceMs && !request.force);

  return {
    shouldAnnounce: !blocked,
    text,
    useScreenReader: !blocked && policy.screenReaderEnabled && !request.forceSpeech,
    useSpeech: !blocked && (request.forceSpeech || !policy.screenReaderEnabled),
    rate: Math.max(0.5, Math.min(2, Number.isFinite(policy.voiceSpeed) ? policy.voiceSpeed : 1)),
    haptic: request.haptic,
    dedupeKey,
    debounceMs
  };
}

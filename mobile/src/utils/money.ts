const NAIRA_SYMBOL = '₦';

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatNaira(amount: number, currency = 'NGN') {
  const formatted = nairaFormatter.format(amount);
  return currency === 'NGN' ? `${NAIRA_SYMBOL}${formatted}` : `${currency} ${formatted}`;
}

export function formatKobo(kobo: number, currency = 'NGN') {
  return formatNaira(kobo / 100, currency);
}

export function parseNairaInput(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [naira, fraction = ''] = normalized.split('.');
  const kobo = Number(naira) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

export function formatSignedNaira(amount: number, direction?: 'debit' | 'credit', currency = 'NGN') {
  const sign = direction === 'debit' ? '-' : direction === 'credit' ? '+' : '';
  return `${sign}${formatNaira(amount, currency)}`;
}

export function formatAccountNumber(accountNumber: string) {
  return accountNumber.replace(/(\d{4})(\d{4})/, '$1 $2');
}

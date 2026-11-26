import * as Crypto from 'expo-crypto';

export function createIdempotencyKey() {
  return `af-${Crypto.randomUUID()}`;
}

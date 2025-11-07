const DEFAULT_MIN = 1;
const DEFAULT_MAX = 45;
const DEFAULT_TICKET_SIZE = 6;
const SALT_LENGTH = 8;

export interface RandomNumberOptions {
  min?: number;
  max?: number;
  exclude?: Iterable<number>;
}

function requireCrypto(): Crypto {
  const cryptoRef = globalThis.crypto ?? (globalThis as unknown as { msCrypto?: Crypto }).msCrypto;
  if (!cryptoRef || typeof cryptoRef.getRandomValues !== 'function') {
    throw new Error('[drawRng] Web Crypto API is not available in this environment');
  }
  return cryptoRef;
}

function randomUint32(): number {
  const cryptoRef = requireCrypto();
  const buffer = new Uint32Array(1);
  cryptoRef.getRandomValues(buffer);
  return buffer[0];
}

export function cryptoRandomInt(min = DEFAULT_MIN, max = DEFAULT_MAX): number {
  if (max < min) {
    throw new Error('[drawRng] max must be greater than or equal to min');
  }

  const range = max - min + 1;
  const maxAcceptable = Math.floor(0xffffffff / range) * range;
  let candidate = randomUint32();

  while (candidate >= maxAcceptable) {
    candidate = randomUint32();
  }

  return min + (candidate % range);
}

export function createDrawSeed(): string {
  const cryptoRef = requireCrypto();
  const saltBuffer = new Uint8Array(SALT_LENGTH);
  cryptoRef.getRandomValues(saltBuffer);
  const salt = Array.from(saltBuffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${new Date().toISOString()}-${salt}`;
}

export function generateUniqueNumbers(count: number, options?: RandomNumberOptions): number[] {
  if (count <= 0) {
    return [];
  }

  const min = options?.min ?? DEFAULT_MIN;
  const max = options?.max ?? DEFAULT_MAX;
  const rangeSize = max - min + 1;

  if (rangeSize < count) {
    throw new Error('[drawRng] Range too small to satisfy unique number request');
  }

  const excluded = new Set<number>(options?.exclude ?? []);
  const results = new Set<number>();

  while (results.size < count) {
    const candidate = cryptoRandomInt(min, max);
    if (!excluded.has(candidate) && !results.has(candidate)) {
      results.add(candidate);
    }
  }

  return Array.from(results).sort((a, b) => a - b);
}

export function completeSelection(baseSelection: number[], targetSize = DEFAULT_TICKET_SIZE): number[] {
  const uniqueBase = Array.from(new Set(baseSelection));
  if (uniqueBase.length > targetSize) {
    throw new Error('[drawRng] Base selection exceeds target size');
  }

  const needed = targetSize - uniqueBase.length;
  const generated = generateUniqueNumbers(needed, { exclude: uniqueBase });
  return Array.from(new Set([...uniqueBase, ...generated])).sort((a, b) => a - b);
}

export function drawNextNumber(existingNumbers: Iterable<number>): number {
  const taken = new Set(existingNumbers);
  if (taken.size >= DEFAULT_MAX) {
    throw new Error('[drawRng] All numbers in range already drawn');
  }

  let candidate = cryptoRandomInt();
  while (taken.has(candidate)) {
    candidate = cryptoRandomInt();
  }

  return candidate;
}

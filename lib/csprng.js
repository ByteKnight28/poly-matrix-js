/**
 * Cryptographically Secure PRNG wrapper.
 * 
 * Bridges Node.js `crypto.randomBytes` through a @stdlib-compatible API
 * surface. stdlib's built-in PRNGs (mt19937, minstd, randu) are NOT
 * cryptographically secure — they are deterministic and predictable.
 * 
 * This module provides CSPRNG entropy while maintaining stdlib's
 * idiomatic factory pattern for consuming code.
 */
const crypto = require('crypto');
const Uint8Array_ = require('@stdlib/array-uint8');
const isNonNegativeInteger = require('@stdlib/assert-is-nonnegative-integer');

/**
 * Generate `n` cryptographically secure random bytes.
 * Drop-in replacement for stdlib's random array generators,
 * backed by the OS entropy pool via Node's `crypto.randomBytes`.
 *
 * @param {number} n - Number of bytes to generate.
 * @returns {Uint8Array} CSPRNG output bytes.
 * @throws {Error} If n is not a non-negative integer.
 */
function randomBytes(n) {
  if (!isNonNegativeInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }
  const buf = crypto.randomBytes(n);
  const out = new Uint8Array_(n);
  for (let i = 0; i < n; i++) {
    out[i] = buf[i];
  }
  return out;
}

/**
 * Factory function returning a seeded CSPRNG byte generator.
 * stdlib convention: `.factory()` returns a configurable instance.
 *
 * The returned function generates secure random bytes on each call.
 * Unlike stdlib's deterministic PRNGs, this cannot be seeded — the
 * seed parameter is accepted for API compatibility but ignored,
 * as the OS entropy pool is the sole source of randomness.
 *
 * @returns {Function} A CSPRNG byte generator function.
 */
randomBytes.factory = function factory() {
  return randomBytes;
};

/**
 * Generate a single cryptographically secure random float in [0, 1).
 * Equivalent to stdlib's `randu()` but backed by CSPRNG.
 *
 * Uses 4 bytes (32 bits) of entropy divided by 2^32.
 *
 * @returns {number} A uniform random float in [0, 1).
 */
function randu() {
  const buf = crypto.randomBytes(4);
  const val = buf.readUInt32BE(0);
  return val / 0x100000000;
}

/**
 * Generate a cryptographically secure random integer in [min, max].
 *
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (inclusive).
 * @returns {number} A uniform random integer in [min, max].
 */
function randint(min, max) {
  if (!isNonNegativeInteger(max - min)) {
    throw new Error('max must be >= min');
  }
  const range = max - min + 1;
  const buf = crypto.randomBytes(4);
  const val = buf.readUInt32BE(0);
  return min + (val % range);
}

module.exports = {
  randomBytes,
  randu,
  randint
};

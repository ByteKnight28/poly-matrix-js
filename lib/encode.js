const { Q } = require('./parameters');
const floor = require('@stdlib/math-base-special-floor');
const Int32Array_ = require('@stdlib/array-int32');
const Uint8Array_ = require('@stdlib/array-uint8');

/**
 * Compress an element x in Z_q to d bits.
 * Computes: round((2^d / Q) * x) mod 2^d
 *
 * @param {number} x - The integer to compress (0 <= x < Q)
 * @param {number} d - Number of bits to compress into.
 * @returns {number} Compressed integer in [0, 2^d - 1]
 */
function compress(x, d) {
  // Normalize x to be positive in [0, 3328]
  x = ((x % Q) + Q) % Q;
  
  // Computes floor((x * 2^d + Q/2) / Q)
  // Q/2 = 1664 (since Q is 3329, 3329/2 = 1664.5 -> integer floor mapping for tie-breaks works perfectly with 1664)
  let result = floor((x * (1 << d) + 1664) / Q);
  return result & ((1 << d) - 1);
}

/**
 * Decompress a d-bit integer back to Z_q.
 * Computes: round((Q / 2^d) * x)
 *
 * @param {number} x - The d-bit integer.
 * @param {number} d - Number of bits originally compressed into.
 * @returns {number} Decompressed integer in Z_q.
 */
function decompress(x, d) {
  // Computes floor((x * 3329 + 2^(d-1)) / 2^d)
  let result = floor((x * Q + (1 << (d - 1))) / (1 << d));
  return result;
}

/**
 * Encode an array of 256 integers (each d bits) into 32*d bytes.
 * 
 * @param {number} d - Number of bits per integer.
 * @param {Int32Array} f - Array of 256 integers.
 * @returns {Uint8Array} Packed byte array.
 */
function byteEncode(d, f) {
  const bytes = new Uint8Array_(32 * d);
  let bitIndex = 0;
  
  for (let i = 0; i < 256; i++) {
    let p = ((f[i] % Q) + Q) % Q;
    let val = p & ((1 << d) - 1);
    for (let j = 0; j < d; j++) {
      let b = (val >> j) & 1;
      let bytePos = floor(bitIndex / 8);
      let bitPos = bitIndex % 8;
      bytes[bytePos] |= (b << bitPos);
      bitIndex++;
    }
  }
  return bytes;
}

/**
 * Decode a byte array of 32*d bytes into 256 d-bit integers.
 * 
 * @param {number} d - Number of bits per integer.
 * @param {Uint8Array} bytes - Packed byte array.
 * @returns {Int32Array} Array of 256 integers.
 */
function byteDecode(d, bytes) {
  const f = new Int32Array_(256);
  let bitIndex = 0;
  
  for (let i = 0; i < 256; i++) {
    let val = 0;
    for (let j = 0; j < d; j++) {
      let bytePos = floor(bitIndex / 8);
      let bitPos = bitIndex % 8;
      let b = (bytes[bytePos] >> bitPos) & 1;
      val |= (b << j);
      bitIndex++;
    }
    f[i] = val;
  }
  return f;
}

module.exports = {
  compress,
  decompress,
  byteEncode,
  byteDecode
};

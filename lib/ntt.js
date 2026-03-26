const { montgomeryReduce, barrettReduce } = require('./reduce');
const { ZETAS } = require('./zetas');

/**
 * Forward Number Theoretic Transform (NTT) for ML-KEM.
 * Modifies the array in place.
 * 
 * @param {Int32Array} r - Polynomial represented as an Int32Array of length 256.
 */
function ntt(r) {
  let k = 1;
  for (let len = 128; len >= 2; len >>= 1) {
    for (let start = 0; start < 256; start = start + 2 * len) {
      let zeta = ZETAS[k++];
      for (let j = start; j < start + len; j++) {
        let t = montgomeryReduce(Math.imul(zeta, r[j + len]));
        r[j + len] = r[j] - t;
        r[j] = r[j] + t;
      }
    }
  }
}

/**
 * Inverse Number Theoretic Transform (INTT) for ML-KEM.
 * Modifies the array in place.
 * 
 * @param {Int32Array} r - Polynomial represented as an Int32Array of length 256.
 */
function invNTT(r) {
  let k = 127;
  for (let len = 2; len <= 128; len <<= 1) {
    for (let start = 0; start < 256; start = start + 2 * len) {
      let zeta = ZETAS[k--];
      for (let j = start; j < start + len; j++) {
        let t = r[j];
        r[j] = barrettReduce(t + r[j + len]);
        r[j + len] = r[j + len] - t;
        r[j + len] = montgomeryReduce(Math.imul(zeta, r[j + len]));
      }
    }
  }

  // Multiply by n^-1 (128^-1) mod q, which is 3303.
  for (let j = 0; j < 256; j++) {
    r[j] = barrettReduce(Math.imul(r[j], 3303));
  }
}

module.exports = {
  ntt,
  invNTT
};

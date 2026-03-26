const { montgomeryReduce } = require('./reduce');
const { ZETAS } = require('./zetas');

/**
 * Pointwise multiply two polynomials in the NTT domain.
 * Follows FIPS 203 BaseCaseMultiply for Z_q[X]/(X^2 - zeta).
 * 
 * @param {Int32Array} a - NTT representation of first polynomial.
 * @param {Int32Array} b - NTT representation of second polynomial.
 * @param {Int32Array} result - Destination array.
 */
function polyPointwise(a, b, result) {
  for (let i = 0; i < 128; i++) {
    // Kyber Pointwise Multiplication relies on the 64 roots from the bottom layer of the NTT.
    // Pair 2*i uses ZETAS[64 + i], pair 2*i + 1 uses -ZETAS[64 + i].
    let zeta_mont = ZETAS[64 + Math.floor(i / 2)];
    if (i % 2 === 1) {
      zeta_mont = -zeta_mont;
    }
    
    let a0 = a[2 * i];
    let a1 = a[2 * i + 1];
    let b0 = b[2 * i];
    let b1 = b[2 * i + 1];

    let a1b1 = Math.imul(a1, b1) % 3329;
    let a1b1zeta = montgomeryReduce(Math.imul(a1b1, zeta_mont));
    
    let a0b0 = Math.imul(a0, b0) % 3329;
    let c0 = (a0b0 + a1b1zeta) % 3329;

    let a0b1 = Math.imul(a0, b1) % 3329;
    let a1b0 = Math.imul(a1, b0) % 3329;
    let c1 = (a0b1 + a1b0) % 3329;
    
    if (c0 < 0) c0 += 3329;
    if (c1 < 0) c1 += 3329;

    result[2 * i] = c0;
    result[2 * i + 1] = c1;
  }
}

/**
 * Add two polynomial vectors element-wise.
 * 
 * @param {Int32Array} a 
 * @param {Int32Array} b 
 * @param {Int32Array} result 
 */
function polyAdd(a, b, result) {
  for (let i = 0; i < 256; i++) {
    result[i] = (a[i] + b[i]) % 3329;
    if (result[i] < 0) result[i] += 3329;
  }
}

/**
 * Subtract two polynomials (a - b).
 */
function polySub(a, b, result) {
  for (let i = 0; i < 256; i++) {
    result[i] = (a[i] - b[i]) % 3329;
    if (result[i] < 0) result[i] += 3329;
  }
}

module.exports = {
  polyPointwise,
  polyAdd,
  polySub
};

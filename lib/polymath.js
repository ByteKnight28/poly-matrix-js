const { montgomeryReduce } = require('./reduce');
const { ZETAS } = require('./zetas');
const imul = require('@stdlib/math-base-ops-imul');

/**
 * Pointwise multiply two polynomials in the NTT domain.
 * Follows FIPS 203 BaseCaseMultiply for Z_q[X]/(X^2 - zeta).
 * 
 * @param {Int32Array} a - NTT representation of first polynomial.
 * @param {Int32Array} b - NTT representation of second polynomial.
 * @param {Int32Array} result - Destination array.
 */
function polyPointwise(a, b, result) {
  for (let i = 0; i < 64; i++) {
    // FIPS 203 BaseCaseMultiply over Z_q[X]/(X^2 - zeta).
    // ZETAS are in Montgomery domain; coefficients from NTT are in standard domain.
    // montgomeryReduce(a * zeta_mont) correctly removes the R factor from zeta.
    let zeta = ZETAS[64 + i];

    // --- First pair (even index): root = +zeta ---
    let a0 = a[4 * i];
    let a1 = a[4 * i + 1];
    let b0 = b[4 * i];
    let b1 = b[4 * i + 1];

    // c0 = a0*b0 + a1*b1*zeta
    let a1b1 = imul(a1, b1) % 3329;
    let c0 = (imul(a0, b0) % 3329) + montgomeryReduce(imul(a1b1, zeta));
    c0 = ((c0 % 3329) + 3329) % 3329;

    // c1 = a0*b1 + a1*b0
    let c1 = (imul(a0, b1) % 3329) + (imul(a1, b0) % 3329);
    c1 = ((c1 % 3329) + 3329) % 3329;

    result[4 * i] = c0;
    result[4 * i + 1] = c1;

    // --- Second pair (odd index): root = -zeta ---
    a0 = a[4 * i + 2];
    a1 = a[4 * i + 3];
    b0 = b[4 * i + 2];
    b1 = b[4 * i + 3];

    a1b1 = imul(a1, b1) % 3329;
    c0 = (imul(a0, b0) % 3329) + montgomeryReduce(imul(a1b1, -zeta));
    c0 = ((c0 % 3329) + 3329) % 3329;

    c1 = (imul(a0, b1) % 3329) + (imul(a1, b0) % 3329);
    c1 = ((c1 % 3329) + 3329) % 3329;

    result[4 * i + 2] = c0;
    result[4 * i + 3] = c1;
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

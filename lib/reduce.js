const { Q } = require('./parameters');

const QINV = 62209; // -3327. q^-1 mod 2^16

/**
 * Montgomery reduction.
 * Computes a * R^-1 mod Q, where R = 2^16.
 * Input 'a' should be a 32-bit integer.
 *
 * @param {number} a - The 32-bit integer to reduce.
 * @returns {number} The 16-bit reduced integer (-Q < result < Q).
 */
function montgomeryReduce(a) {
	// Equivalent to C: int16_t t = (int16_t)a * QINV;
	let a16 = (a << 16) >> 16; // sign-extend low 16 bits
	let t = Math.imul(a16, -3327); // result is 32-bit int
	t = (t << 16) >> 16; // cast to int16_t
	
	let res = (a - Math.imul(t, Q)) >> 16;
	return res;
}

/**
 * Barrett reduction.
 * Computes a mod Q.
 * Input 'a' should be within 16-bit limits usually.
 *
 * @param {number} a - The integer to reduce.
 * @returns {number} The reduced integer (centered, roughly between -Q/2 and Q/2).
 */
function barrettReduce(a) {
	let t = (Math.imul(20159, a) + (1 << 25)) >> 26;
	return a - Math.imul(t, Q);
}

/**
 * Conditional subtract Q.
 * If a >= Q, subtract Q.
 *
 * @param {number} a - Input integer.
 * @returns {number} Reduced integer.
 */
function csubq(a) {
	a -= Q;
	a += (a >> 31) & Q;
	return a;
}

module.exports = {
	montgomeryReduce,
	barrettReduce,
	csubq
};

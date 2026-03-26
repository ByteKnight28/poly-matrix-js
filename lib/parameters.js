/**
 * FIPS 203 ML-KEM Parameters
 */

/**
 * The prime modulus q = 3329.
 *
 * @constant
 * @type {number}
 * @default 3329
 */
const Q = 3329;

/**
 * The degree of the polynomial ring n = 256.
 *
 * @constant
 * @type {number}
 * @default 256
 */
const N = 256;

/**
 * ML-KEM Parameter Sets
 * ML-KEM-512 : k=2
 * ML-KEM-768 : k=3
 * ML-KEM-1024: k=4
 */
const PARAMETERS = {
	'ML-KEM-512': {
		k: 2,
		eta1: 3,
		eta2: 2,
		du: 10,
		dv: 4
	},
	'ML-KEM-768': {
		k: 3,
		eta1: 2,
		eta2: 2,
		du: 10,
		dv: 4
	},
	'ML-KEM-1024': {
		k: 4,
		eta1: 2,
		eta2: 2,
		du: 11,
		dv: 5
	}
};

module.exports = {
	Q,
	N,
	PARAMETERS
};

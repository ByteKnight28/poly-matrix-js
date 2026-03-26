const { N } = require('./parameters');

/**
 * PolyMatrix represents a polynomial vector or matrix over the ring R_q.
 * It is backed by a single flat Int32Array to avoid memory fragmentation
 * and provide continuous memory access paths useful for future WebAssembly usage.
 *
 * For a matrix A of size (rows x cols), each entry is a polynomial of degree N-1.
 * Memory size required = rows * cols * N * 4 bytes (Int32).
 */
class PolyMatrix {
	/**
	 * Creates a new PolyMatrix.
	 *
	 * @param {number} rows - Number of rows.
	 * @param {number} cols - Number of columns.
	 * @param {Int32Array} [buffer] - Optional 1D Int32Array buffer to wrap.
	 */
	constructor(rows, cols, buffer) {
		this.rows = rows;
		this.cols = cols;
		this.N = N;
		const length = rows * cols * N;

		if (buffer) {
			if (buffer.length !== length) {
				throw new Error('Buffer length does not match matrix dimensions.');
			}
			this.data = buffer;
		} else {
			this.data = new Int32Array(length);
		}
	}

	/**
	 * Returns the linear starting offset of the polynomial at (row, col).
	 *
	 * @param {number} row - The row index.
	 * @param {number} col - The column index.
	 * @returns {number} The starting array index.
	 */
	_offset(row, col) {
		return (row * this.cols + col) * this.N;
	}

	/**
	 * Set a specific coefficient in the polynomial at (row, col).
	 *
	 * @param {number} row - Row index.
	 * @param {number} col - Column index.
	 * @param {number} idx - Polynomial coefficient index (0 to N-1).
	 * @param {number} val - The integer value.
	 */
	setCoeff(row, col, idx, val) {
		this.data[this._offset(row, col) + idx] = val;
	}

	/**
	 * Get a specific coefficient from the polynomial at (row, col).
	 *
	 * @param {number} row - Row index.
	 * @param {number} col - Column index.
	 * @param {number} idx - Polynomial coefficient index.
	 * @returns {number} The integer coefficient.
	 */
	getCoeff(row, col, idx) {
		return this.data[this._offset(row, col) + idx];
	}

	/**
	 * Slices a single polynomial from the matrix as a subarray, returning an Int32Array reference.
	 * Modifying this reference modifies the underlying matrix.
	 *
	 * @param {number} row - Row index.
	 * @param {number} col - Column index.
	 * @returns {Int32Array} Subarray mapping to the specific polynomial.
	 */
	getPoly(row, col) {
		const start = this._offset(row, col);
		return this.data.subarray(start, start + this.N);
	}
}

module.exports = PolyMatrix;

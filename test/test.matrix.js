const test = require('tape');
const PolyMatrix = require('../lib/matrix');
const { N } = require('../lib/parameters');

test('PolyMatrix Initialization', t => {
	const k = 3;
	const m = new PolyMatrix(k, k);
	
	t.equal(m.rows, k, 'Rows should be correctly initialized');
	t.equal(m.cols, k, 'Cols should be correctly initialized');
	t.equal(m.data.length, k * k * N, 'Data length should match the 3D dimensions');
	t.end();
});

test('PolyMatrix Coefficient Access', t => {
	const m = new PolyMatrix(2, 2);
	m.setCoeff(1, 1, 0, 42); // set coeff 0 of polynomial at (1, 1) to 42
	m.setCoeff(0, 1, 255, 999);

	t.equal(m.getCoeff(1, 1, 0), 42, 'getCoeff retrieves correctly set values');
	t.equal(m.getCoeff(0, 1, 255), 999, 'Boundary getCoeff is correct');
	t.end();
});

test('PolyMatrix Subarray slicing without memory leaks', t => {
	const m = new PolyMatrix(2, 2);
	const poly = m.getPoly(1, 0);
	
	t.equal(poly.length, N, 'Subarray length is N');
	
	// Modifying subarray modifies the underlying buffer correctly
	poly[128] = 3329;
	t.equal(m.getCoeff(1, 0, 128), 3329, 'Subarray mutation reflects on original matrix buffer');
	
	t.end();
});

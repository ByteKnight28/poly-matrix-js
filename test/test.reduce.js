const test = require('tape');
const { montgomeryReduce, barrettReduce, csubq } = require('../lib/reduce');
const { Q } = require('../lib/parameters');

test('montgomeryReduce', t => {
	// Test basic Montgomery reduction
	// We want to reduce a * R^-1 mod Q where R = 2^16
	// Let's test with a = 12345 * 2^16, result should be 12345 mod Q
	// Wait, 12345 * 2^16 = 809041920
	// 809041920 doesn't fit in 32-bit signed if it goes over 2B, but it's 809M, which fits.
	
	let a = 12345 * 65536;
	let res = montgomeryReduce(a);
	t.equal(res % Q, 12345 % Q, 'montgomeryReduce un-shifts correctly');

	// Let's test with known kyber constants
	const z = Math.imul(-1, 65536);
	t.equal(montgomeryReduce(z) % Q, -1 % Q, 'montgomeryReduce negative correctly');
	
	t.end();
});

test('barrettReduce', t => {
	t.equal(barrettReduce(3329), 0, 'barrettReduce 3329 is 0');
	t.equal(barrettReduce(3330), 1, 'barrettReduce 3330 is 1');
	t.equal(barrettReduce(-3328), 1, 'barrettReduce -3328 is 1');
	t.end();
});

test('csubq', t => {
	t.equal(csubq(3329), 0, 'csubq 3329 is 0');
	t.equal(csubq(3330), 1, 'csubq 3330 is 1');
	t.equal(csubq(10), 10, 'csubq 10 is 10');
	t.end();
});

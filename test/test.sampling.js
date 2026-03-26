const test = require('tape');
const { sampleCBD } = require('../lib/cbd');
const { sampleNTT } = require('../lib/sampling');
const { PRF } = require('../lib/hash');

test('Centered Binomial Distribution Constraints', t => {
  const seed = new Uint8Array(32);
  seed.fill(42);
  const bytes = PRF(2, seed, 0); // eta=2
  
  t.equal(bytes.length, 128, 'PRF generates 64 * eta bytes (128 for eta=2)');
  
  const poly = sampleCBD(bytes, 2);
  t.equal(poly.length, 256, 'CBD outputs 256 coefficients');
  
  // Assert bounds logic
  let withinBounds = true;
  for (let i = 0; i < 256; i++) {
    if (poly[i] > 2 || poly[i] < -2) withinBounds = false;
  }
  t.ok(withinBounds, 'All CBD coefficients strictly bounded by [-2, 2]');
  t.end();
});

test('Uniform Rejection Sampling Constraints', t => {
  const seed = new Uint8Array(32);
  seed.fill(99);
  
  const poly = new Int32Array(256);
  sampleNTT(seed, 0, 0, poly);
  
  let withinBounds = true;
  for (let i = 0; i < 256; i++) {
    if (poly[i] >= 3329 || poly[i] < 0) withinBounds = false;
  }
  t.ok(withinBounds, 'All rejection sampled coefficients are strictly within [0, 3328]');
  t.end();
});

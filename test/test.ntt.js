const test = require('tape');
const { ntt, invNTT } = require('../lib/ntt');
const { csubq } = require('../lib/reduce');

test('NTT and INTT Reversibility', t => {
  const poly = new Int32Array(256);
  // Initialize with random values from 0 to 3328
  for (let i = 0; i < 256; i++) {
    poly[i] = i * 13 % 3329;
  }
  
  const clone = new Int32Array(poly);
  
  // Transform
  ntt(poly);
  // Inverse transform
  invNTT(poly);
  
  let matches = true;
  for (let i = 0; i < 256; i++) {
    let p_norm = ((poly[i] % 3329) + 3329) % 3329;
    let c_norm = ((clone[i] % 3329) + 3329) % 3329;

    if (p_norm !== c_norm) {
      matches = false;
      console.log(`Mismatch at ${i}: expected ${c_norm}, got ${p_norm} (raw ${poly[i]})`);
      break;
    }
  }
  
  t.ok(matches, 'NTT followed by INTT successfully recovers original polynomial');
  t.end();
});

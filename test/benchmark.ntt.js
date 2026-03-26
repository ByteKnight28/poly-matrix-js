const { ntt, invNTT } = require('../lib/ntt');

function benchmarkNTT() {
  const poly = new Int32Array(256);
  for (let i = 0; i < 256; i++) poly[i] = i;

  const ITERATIONS = 100000;
  console.log(`Benchmarking NTT for ${ITERATIONS} iterations...`);

  console.time('NTT');
  for (let i = 0; i < ITERATIONS; i++) {
    ntt(poly);
  }
  console.timeEnd('NTT');

  console.time('invNTT');
  for (let i = 0; i < ITERATIONS; i++) {
    invNTT(poly);
  }
  console.timeEnd('invNTT');
}

benchmarkNTT();

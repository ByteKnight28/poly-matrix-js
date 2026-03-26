const { ntt, invNTT } = require('./lib/ntt');
const { montgomeryReduce } = require('./lib/reduce');

let a = new Int32Array(256);
a[0] = 1;

ntt(a);
console.log('After NTT (first 4):', a.slice(0, 4));

invNTT(a);
console.log('After INTT (first 4):', a.slice(0, 4));

// what if we just multiply by Montgomery constant 128?
// Wait, 128^-1 is 3303.
// INTT output before multiplying by f=1441:
let a2 = new Int32Array(256);
a2[0] = 1;
ntt(a2);

const { ZETAS } = require('./lib/zetas');
function invNTT_no_f(r) {
  let k = 127;
  for (let len = 2; len <= 128; len <<= 1) {
    for (let start = 0; start < 256; start = start + 2 * len) {
      let zeta = ZETAS[k--];
      for (let j = start; j < start + len; j++) {
        let t = r[j];
        r[j] = (t + r[j + len]);
        r[j + len] = r[j + len] - t;
        r[j + len] = montgomeryReduce(Math.imul(zeta, r[j + len]));
      }
    }
  }
}

invNTT_no_f(a2);
console.log('After INTT without f (first 4):', a2.slice(0, 4));

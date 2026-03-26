const test = require('tape');
const { mlKemKeyGen, mlKemEncaps, mlKemDecaps } = require('../lib/kem');

test('ML-KEM Full Key Encapsulation Protocol', t => {
  const d = new Uint8Array(32);
  d.fill(42);
  const z = new Uint8Array(32);
  z.fill(99);

  const { ek, dk } = mlKemKeyGen(d, z, 'ML-KEM-512');
  
  const m = new Uint8Array(32);
  m.fill(77);
  const { K, c } = mlKemEncaps(ek, m, 'ML-KEM-512');
  
  const K_decaps = mlKemDecaps(c, dk, 'ML-KEM-512');
  
  t.deepEqual(K_decaps, K, 'Decapsulated shared secret matches encapsulated shared secret exactly');
  t.end();
});

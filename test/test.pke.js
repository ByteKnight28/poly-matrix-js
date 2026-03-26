const test = require('tape');
const { pkeKeyGen } = require('../lib/pke');

test('K-PKE KeyGen Basic Execution', t => {
  const d = new Uint8Array(32);
  d.fill(12); // dummy random
  
  const { ek, dk } = pkeKeyGen(d, 'ML-KEM-512'); // k=2
  
  // For ML-KEM-512, ek length should be 384 * 2 + 32 = 800 bytes
  // dk length should be 384 * 2 = 768 bytes
  t.equal(ek.length, 800, 'ek generated has correct byte length for k=2');
  t.equal(dk.length, 768, 'dk generated has correct byte length for k=2');
  
  t.end();
});

test('K-PKE Encrypt and Decrypt reversibility', t => {
  const d = new Uint8Array(32);
  d.fill(99); 
  const { ek, dk } = pkeKeyGen(d, 'ML-KEM-512');
  
  const m = new Uint8Array(32);
  for (let i = 0; i < 32; i++) m[i] = i * 5;
  const r = new Uint8Array(32);
  r.fill(77);

  console.log('Starting Extract pkeEncrypt...');
  const cBytes = require('../lib/pke').pkeEncrypt(ek, m, r, 'ML-KEM-512');
  console.log('Finished pkeEncrypt!!!');
  t.equal(cBytes.length, 32 * 10 * 2 + 32 * 4, 'Ciphertext size is correct');

  console.log('Starting pkeDecrypt...');
  const mDecrypted = require('../lib/pke').pkeDecrypt(dk, cBytes, 'ML-KEM-512');
  console.log('Finished pkeDecrypt!!!');
  t.deepEqual(mDecrypted, m, 'Decrypted message exactly matches strictly original message');
  
  t.end();
});

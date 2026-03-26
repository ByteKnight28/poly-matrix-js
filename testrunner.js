const { pkeKeyGen, pkeEncrypt, pkeDecrypt } = require('./lib/pke');

console.log('1. Gen key');
const d = new Uint8Array(32);
d.fill(99); 
const { ek, dk } = pkeKeyGen(d, 'ML-KEM-512');
console.log('Key generated. Length ek:', ek.length);

console.log('2. Encrypt');
const m = new Uint8Array(32);
const r = new Uint8Array(32);
const c = pkeEncrypt(ek, m, r, 'ML-KEM-512');
console.log('Encrypted! length c:', c.length);

console.log('3. Decrypt');
const md = pkeDecrypt(dk, c, 'ML-KEM-512');
console.log('Decrypted!', md[0], md[1]);

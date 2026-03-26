const { pkeKeyGen, pkeEncrypt, pkeDecrypt } = require('./pke');
const { G, H, J } = require('./hash');

/**
 * ML-KEM Key Generation
 * 
 * @param {Uint8Array} d - 32 bytes deterministic randomness
 * @param {Uint8Array} z - 32 bytes deterministic randomness (for implicit rejection)
 * @param {string} paramSet - ML-KEM-512, ML-KEM-768, ML-KEM-1024
 */
function mlKemKeyGen(d, z, paramSet = 'ML-KEM-512') {
  const { ek, dk } = pkeKeyGen(d, paramSet);
  
  const fullDk = new Uint8Array(dk.length + ek.length + 32 + 32);
  fullDk.set(dk, 0);
  fullDk.set(ek, dk.length);
  fullDk.set(H(ek), dk.length + ek.length);
  fullDk.set(z, dk.length + ek.length + 32);
  
  return { ek, dk: fullDk };
}

/**
 * ML-KEM Encapsulation
 * 
 * @param {Uint8Array} ek - Public key
 * @param {Uint8Array} m - 32 bytes of randomness
 * @param {string} paramSet 
 */
function mlKemEncaps(ek, m, paramSet = 'ML-KEM-512') {
  const input = new Uint8Array(32 + 32);
  input.set(m, 0);
  input.set(H(ek), 32);
  
  const hashK = G(input);
  const K = hashK.slice(0, 32);
  const r = hashK.slice(32, 64);
  
  const c = pkeEncrypt(ek, m, r, paramSet);
  return { K, c };
}

/**
 * ML-KEM Decapsulation
 * 
 * @param {Uint8Array} c - Ciphertext
 * @param {Uint8Array} dk - Decapsulation key
 * @param {string} paramSet 
 */
function mlKemDecaps(c, dk, paramSet = 'ML-KEM-512') {
  const kLength = paramSet === 'ML-KEM-512' ? 2 : paramSet === 'ML-KEM-768' ? 3 : 4;
  const dkPkeLen = 384 * kLength;
  const ekPkeLen = 384 * kLength + 32;

  const dkPKE = dk.slice(0, dkPkeLen);
  const ekPKE = dk.slice(dkPkeLen, dkPkeLen + ekPkeLen);
  const h = dk.slice(dkPkeLen + ekPkeLen, dkPkeLen + ekPkeLen + 32);
  const z = dk.slice(dkPkeLen + ekPkeLen + 32);

  const mPrime = pkeDecrypt(dkPKE, c, paramSet);
  
  const input = new Uint8Array(32 + 32);
  input.set(mPrime, 0);
  input.set(h, 32);
  const hashK = G(input);
  
  const KPrime = hashK.slice(0, 32);
  const rPrime = hashK.slice(32, 64);
  const cPrime = pkeEncrypt(ekPKE, mPrime, rPrime, paramSet);

  let fail = 0;
  if (c.length !== cPrime.length) fail = 1;
  else {
    for (let i = 0; i < c.length; i++) {
      fail |= (c[i] ^ cPrime[i]);
    }
  }

  const KBar = J(z, c);
  fail = (fail === 0) ? 0 : 0xFF;
  
  const finalK = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    finalK[i] = (KPrime[i] & ~fail) | (KBar[i] & fail);
  }
  return finalK;
}

module.exports = {
  mlKemKeyGen,
  mlKemEncaps,
  mlKemDecaps
};

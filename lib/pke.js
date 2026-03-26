const { compress, decompress, byteEncode, byteDecode } = require('./encode');
const { PRF, G } = require('./hash');
const { sampleCBD } = require('./cbd');
const { sampleNTT } = require('./sampling');
const { ntt, invNTT } = require('./ntt');
const { polyPointwise, polyAdd, polySub } = require('./polymath');
const PolyMatrix = require('./matrix');
const { PARAMETERS, Q } = require('./parameters');

/**
 * ML-KEM K-PKE Key Generation.
 * 
 * @param {Uint8Array} d - 32 bytes of randomness.
 * @param {string} paramSet - ML-KEM-512, ML-KEM-768, ML-KEM-1024
 * @returns {Object} { ek, dk }
 */
function pkeKeyGen(d, paramSet = 'ML-KEM-512') {
  const k = PARAMETERS[paramSet].k;
  const eta1 = PARAMETERS[paramSet].eta1;

  // 1. (rho, sigma) = G(d)
  const gOut = G(d);
  const rho = gOut.slice(0, 32);
  const sigma = gOut.slice(32, 64);

  // 2. Generate matrix A (k x k) uniformly sampled
  const A = new PolyMatrix(k, k);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      sampleNTT(rho, i, j, A.getPoly(i, j));
    }
  }

  // 3. Generate s and e (length k) from CBD, then apply NTT
  const s = new PolyMatrix(k, 1);
  const e = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    const sBytes = PRF(eta1, sigma, i);
    const sPoly = sampleCBD(sBytes, eta1);
    ntt(sPoly);
    const sRef = s.getPoly(i, 0);
    sRef.set(sPoly);

    const eBytes = PRF(eta1, sigma, i + k);
    const ePoly = sampleCBD(eBytes, eta1);
    ntt(ePoly);
    const eRef = e.getPoly(i, 0);
    eRef.set(ePoly);
  }

  // 4. t = A * s + e (matrix mult over polynomials)
  const t = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    const tPoly = t.getPoly(i, 0);
    for (let j = 0; j < k; j++) {
      const temp = new Int32Array(256);
      polyPointwise(A.getPoly(i, j), s.getPoly(j, 0), temp);
      polyAdd(tPoly, temp, tPoly);
    }
    polyAdd(tPoly, e.getPoly(i, 0), tPoly);
  }

  // 5. Serialize ek and dk
  // ek is ByteEncode_12(t) || rho
  // dk is ByteEncode_12(s)
  const ek = new Uint8Array(384 * k + 32);
  const dk = new Uint8Array(384 * k);
  
  for (let i = 0; i < k; i++) {
    let tEnc = byteEncode(12, t.getPoly(i, 0));
    ek.set(tEnc, i * 384);
    
    let sEnc = byteEncode(12, s.getPoly(i, 0));
    dk.set(sEnc, i * 384);
  }
  ek.set(rho, 384 * k);

  return { ek, dk };
}

function pkeEncrypt(ek, m, r, paramSet = 'ML-KEM-512') {
  const k = PARAMETERS[paramSet].k;
  const eta1 = PARAMETERS[paramSet].eta1;
  const eta2 = PARAMETERS[paramSet].eta2;
  const du = PARAMETERS[paramSet].du;
  const dv = PARAMETERS[paramSet].dv;

  const tBytes = ek.slice(0, 384 * k);
  const rho = ek.slice(384 * k);
  
  const t = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    t.getPoly(i, 0).set(byteDecode(12, tBytes.slice(i * 384, (i + 1) * 384)));
  }

  const A = new PolyMatrix(k, k);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      sampleNTT(rho, i, j, A.getPoly(i, j));
    }
  }

  const y = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    let yBytes = PRF(eta1, r, i);
    let yPoly = sampleCBD(yBytes, eta1);
    ntt(yPoly);
    y.getPoly(i, 0).set(yPoly);
  }

  const e1 = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    let e1Bytes = PRF(eta2, r, i + k);
    let e1Poly = sampleCBD(e1Bytes, eta2);
    e1.getPoly(i, 0).set(e1Poly);
  }

  const e2Bytes = PRF(eta2, r, k + k);
  const e2Poly = sampleCBD(e2Bytes, eta2);

  const u = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    const uPoly = u.getPoly(i, 0);
    for (let j = 0; j < k; j++) {
      const temp = new Int32Array(256);
      polyPointwise(A.getPoly(j, i), y.getPoly(j, 0), temp);
      polyAdd(uPoly, temp, uPoly);
    }
    invNTT(uPoly);
    polyAdd(uPoly, e1.getPoly(i, 0), uPoly);
  }

  const vPoly = new Int32Array(256);
  for (let j = 0; j < k; j++) {
    const temp = new Int32Array(256);
    polyPointwise(t.getPoly(j, 0), y.getPoly(j, 0), temp);
    polyAdd(vPoly, temp, vPoly);
  }
  invNTT(vPoly);
  polyAdd(vPoly, e2Poly, vPoly);

  const mDecoded = byteDecode(1, m);
  for (let i = 0; i < 256; i++) {
    let decompressed = decompress(mDecoded[i], 1);
    vPoly[i] = (vPoly[i] + decompressed) % Q;
  }

  const c1Length = 32 * du * k;
  const c1 = new Uint8Array(c1Length);
  for (let i = 0; i < k; i++) {
    let uPolyi = u.getPoly(i, 0);
    const compU = new Int32Array(256);
    for(let c=0; c<256; c++) compU[c] = compress(uPolyi[c], du);
    let encBlock = byteEncode(du, compU);
    c1.set(encBlock, i * 32 * du);
  }

  const c2Length = 32 * dv;
  const c2 = new Uint8Array(c2Length);
  const compV = new Int32Array(256);
  for (let c=0; c<256; c++) compV[c] = compress(vPoly[c], dv);
  c2.set(byteEncode(dv, compV), 0);
  
  const cBytes = new Uint8Array(c1Length + c2Length);
  cBytes.set(c1, 0);
  cBytes.set(c2, c1Length);
  
  return cBytes;
}

function pkeDecrypt(dk, cBytes, paramSet = 'ML-KEM-512') {
  const k = PARAMETERS[paramSet].k;
  const du = PARAMETERS[paramSet].du;
  const dv = PARAMETERS[paramSet].dv;

  const c1Length = 32 * du * k;
  const c1 = cBytes.slice(0, c1Length);
  const c2 = cBytes.slice(c1Length);

  const u = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    let decBlock = byteDecode(du, c1.slice(i * 32 * du, (i + 1) * 32 * du));
    let uPolyi = u.getPoly(i, 0);
    for(let x=0; x<256; x++) uPolyi[x] = decompress(decBlock[x], du);
  }

  const vDecoded = byteDecode(dv, c2);
  const vPoly = new Int32Array(256);
  for(let x=0; x<256; x++) vPoly[x] = decompress(vDecoded[x], dv);

  const s = new PolyMatrix(k, 1);
  for (let i = 0; i < k; i++) {
    s.getPoly(i, 0).set(byteDecode(12, dk.slice(i * 384, (i + 1) * 384)));
  }

  for (let i = 0; i < k; i++) {
    ntt(u.getPoly(i, 0));
  }
  
  const sT_u = new Int32Array(256);
  for (let i = 0; i < k; i++) {
    const temp = new Int32Array(256);
    polyPointwise(s.getPoly(i, 0), u.getPoly(i, 0), temp);
    polyAdd(sT_u, temp, sT_u);
  }
  invNTT(sT_u);
  
  const w = new Int32Array(256);
  polySub(vPoly, sT_u, w);

  const mBits = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    mBits[i] = compress(w[i], 1);
  }
  
  return byteEncode(1, mBits);
}

module.exports = {
  pkeKeyGen,
  pkeEncrypt,
  pkeDecrypt
};

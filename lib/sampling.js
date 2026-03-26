const { XOF_create } = require('./hash');

/**
 * Rejection Sampling.
 * Generates 256 coefficients modulo q directly into the NTT domain
 * by rejecting any 12-bit sequences >= 3329.
 * 
 * @param {Uint8Array} rho - 32-byte seed.
 * @param {number} i - First matrix coordinate.
 * @param {number} j - Second matrix coordinate.
 * @param {Int32Array} poly - 256-length Destination polynomial array.
 */
function sampleNTT(rho, i, j, poly) {
  let index = 0;
  let byteIndex = 0;
  let bytesLength = 840; // 5 blocks of 168 bytes, enough for ~99.999% of cases.
  
  const xof = XOF_create(rho, i, j);
  let B = xof.squeeze(bytesLength);

  while (index < 256) {
    if (byteIndex + 3 > B.length) {
      bytesLength += 168;
      B = xof.squeeze(bytesLength);
    }
    
    let b0 = B[byteIndex];
    let b1 = B[byteIndex + 1];
    let b2 = B[byteIndex + 2];
    byteIndex += 3;
    
    let d1 = b0 | ((b1 & 0x0F) << 8);
    let d2 = (b1 >> 4) | (b2 << 4);
    
    if (d1 < 3329 && index < 256) {
      poly[index++] = d1;
    }
    if (d2 < 3329 && index < 256) {
      poly[index++] = d2;
    }
  }
}

module.exports = {
  sampleNTT
};

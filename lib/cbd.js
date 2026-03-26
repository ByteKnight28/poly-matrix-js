/**
 * Centered Binomial Distribution.
 * Converts an array of bytes from PRF into a 256-coefficient polynomial.
 * 
 * @param {Uint8Array} bytes - 64 * eta bytes.
 * @param {number} eta - Parameter eta (2 or 3).
 * @returns {Int32Array} Polynomial belonging to R_q.
 */
function sampleCBD(bytes, eta) {
  const poly = new Int32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let x = 0;
    let y = 0;
    for (let j = 0; j < eta; j++) {
      // Extract bit for x: index is 2*i*eta + j
      let bitXIndex = 2 * i * eta + j;
      let b_x = bytes[Math.floor(bitXIndex / 8)];
      let bit_x = (b_x >> (bitXIndex % 8)) & 1;
      x += bit_x;
      
      // Extract bit for y: index is 2*i*eta + eta + j
      let bitYIndex = 2 * i * eta + eta + j;
      let b_y = bytes[Math.floor(bitYIndex / 8)];
      let bit_y = (b_y >> (bitYIndex % 8)) & 1;
      y += bit_y;
    }
    
    // f_i = x - y
    // No need to strictly reduce modulus here as it's guaranteed to be in [-eta, eta].
    // A standard Barrett/Montgomery or modulo could be applied later.
    poly[i] = x - y;
  }
  
  return poly;
}

module.exports = {
  sampleCBD
};

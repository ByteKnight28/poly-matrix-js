const { sha3_256, sha3_512, shake128, shake256 } = require('js-sha3');

function H(bytes) {
  return new Uint8Array(sha3_256.arrayBuffer(bytes));
}

function G(bytes) {
  return new Uint8Array(sha3_512.arrayBuffer(bytes));
}

function PRF(eta, s, b) {
  const input = new Uint8Array(33);
  input.set(s, 0);
  input[32] = b;
  return new Uint8Array(shake256.arrayBuffer(input, 64 * eta * 8));
}

// XOF is typically used as an infinite stream via XOF(rho, i, j).
// For the context of JS, it's easier to dynamically generate bytes.
function XOF_create(rho, i, j) {
  const input = new Uint8Array(34);
  input.set(rho, 0);
  input[32] = i;
  input[33] = j;
  return {
    squeeze: function(length) {
      return new Uint8Array(shake128.arrayBuffer(input, length * 8));
    }
  };
}

module.exports = {
  H,
  G,
  PRF,
  XOF_create
};

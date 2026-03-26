const { sha3_256, sha3_512, shake128, shake256 } = require('js-sha3');
const Uint8Array_ = require('@stdlib/array-uint8');

function H(bytes) {
  return new Uint8Array_(sha3_256.arrayBuffer(bytes));
}

function G(bytes) {
  return new Uint8Array_(sha3_512.arrayBuffer(bytes));
}

function PRF(eta, s, b) {
  const input = new Uint8Array_(33);
  input.set(s, 0);
  input[32] = b;
  return new Uint8Array_(shake256.arrayBuffer(input, 64 * eta * 8));
}

// XOF is typically used as an infinite stream via XOF(rho, i, j).
// js-sha3 does NOT support true incremental squeezing — calling arrayBuffer
// with a different length re-hashes from scratch and can produce different
// prefixes. We therefore pre-generate a generous buffer once.
function XOF_create(rho, i, j) {
  const input = new Uint8Array_(34);
  input.set(rho, 0);
  input[32] = i;
  input[33] = j;
  // Pre-squeeze enough bytes for rejection sampling (672 coefficients worth).
  // 840 bytes covers >99.99% of cases for n=256.
  const maxBytes = 840;
  const buf = new Uint8Array_(shake128.arrayBuffer(input, maxBytes * 8));
  return {
    squeeze: function(length) {
      if (length <= buf.length) return buf.subarray(0, length);
      // Fallback: re-generate a larger buffer (same hash, larger output)
      return new Uint8Array_(shake128.arrayBuffer(input, length * 8));
    }
  };
}

function J(z, c) {
  const hash = shake256.create();
  hash.update(z);
  hash.update(c);
  return new Uint8Array_(hash.arrayBuffer(256));
}

module.exports = {
  H,
  G,
  PRF,
  XOF_create,
  J
};

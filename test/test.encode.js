const test = require('tape');
const { compress, decompress, byteEncode, byteDecode } = require('../lib/encode');

test('Compress and Decompress accuracy', t => {
  // Compression to d=10 bits
  const d = 10;
  const x = 3000;
  
  let comp = compress(x, d);
  t.ok(comp >= 0 && comp < 1024, 'Compress bounded to 2^d - 1');
  
  let decomp = decompress(comp, d);
  // Decompression introduces an error bounded by round(Q / 2^(d+1))
  // For d=10: Q / 2048 = 1.625 -> error is at most 2.
  let diff = Math.abs(x - decomp);
  if (diff > 1664) diff = 3329 - diff; // modular distance
  
  t.ok(diff <= 2, `Decompression distance within theoretical error bound. Got offset ${diff}`);
  t.end();
});

test('ByteEncode and ByteDecode determinism', t => {
  const poly = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    poly[i] = Math.floor(Math.random() * 3329); // Q bounds
  }
  
  const d = 12;
  const encoded = byteEncode(d, poly);
  t.equal(encoded.length, 32 * d, 'Produces correct exact byte length');
  
  const decoded = byteDecode(d, encoded);
  let matches = true;
  for (let i = 0; i < 256; i++) {
    if (decoded[i] !== poly[i]) {
      matches = false;
      break;
    }
  }
  t.ok(matches, 'Decoding successfully recovers all original coefficients');
  t.end();
});

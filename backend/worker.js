const { parentPort } = require('worker_threads');
const crypto = require('crypto');
const mlkem = require('../lib/index');

parentPort.on('message', async (msg) => {
  try {
    if (msg.type === 'keygen') {
      const d = crypto.randomBytes(32);
      const z = crypto.randomBytes(32);
      const { ek, dk } = mlkem.mlKemKeyGen(d, z, msg.paramSet);
      parentPort.postMessage({ id: msg.id, success: true, ek, dk });
    } else if (msg.type === 'encaps') {
      const m = crypto.randomBytes(32);
      const { K, c } = mlkem.mlKemEncaps(msg.ek, m, msg.paramSet);
      parentPort.postMessage({ id: msg.id, success: true, K, c });
    } else if (msg.type === 'decaps') {
      const K = mlkem.mlKemDecaps(msg.c, msg.dk, msg.paramSet);
      parentPort.postMessage({ id: msg.id, success: true, K });
    }
  } catch (err) {
    parentPort.postMessage({ id: msg.id, success: false, error: err.message });
  }
});

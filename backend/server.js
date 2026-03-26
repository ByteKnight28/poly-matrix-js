const express = require('express');
const { Worker } = require('worker_threads');
const crypto = require('crypto');
const path = require('path');
const { encryptSymmetric, decryptSymmetric } = require('./cipher');

const app = express();
app.use(express.json());

const worker = new Worker(path.join(__dirname, 'worker.js'));
let pendingTasks = {};

worker.on('message', (result) => {
  if (pendingTasks[result.id]) {
    pendingTasks[result.id](result);
    delete pendingTasks[result.id];
  }
});

function runWorkerTask(task) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    pendingTasks[id] = (result) => {
      if (result.success) resolve(result);
      else reject(new Error(result.error));
    };
    worker.postMessage({ ...task, id });
  });
}

// In-memory key store (Session Directory)
const keyDirectory = {};
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

app.get('/key', async (req, res) => {
  try {
    const result = await runWorkerTask({ type: 'keygen', paramSet: 'ML-KEM-512' });
    const sessionId = crypto.randomUUID();
    
    keyDirectory[sessionId] = {
      dk: result.dk,
      createdAt: Date.now()
    };
    
    res.json({
      sessionId,
      ek: Buffer.from(result.ek).toString('base64')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/handshake', async (req, res) => {
  try {
    const { sessionId, cBase64 } = req.body;
    if (!keyDirectory[sessionId]) return res.status(404).json({ error: 'Session not found' });
    
    const session = keyDirectory[sessionId];
    // Enforce session TTL
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      delete keyDirectory[sessionId];
      return res.status(410).json({ error: 'Session expired' });
    }
    const c = new Uint8Array(Buffer.from(cBase64, 'base64'));
    
    const result = await runWorkerTask({
      type: 'decaps',
      c,
      dk: session.dk,
      paramSet: 'ML-KEM-512'
    });
    
    session.symmetricKey = result.K;
    delete session.dk; // Drop the decryption key from RAM directly to satisfy forward secrecy lifecycle
    
    const ack = encryptSymmetric(result.K, JSON.stringify({ message: "Handshake verified securely." }));
    
    res.json({ success: true, ack });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/message', (req, res) => {
  try {
    const { sessionId, iv, ciphertext, authTag } = req.body;
    if (!keyDirectory[sessionId] || !keyDirectory[sessionId].symmetricKey) {
      return res.status(403).json({ error: 'Session lack symmetric channel' });
    }
    
    const decrypted = decryptSymmetric(keyDirectory[sessionId].symmetricKey, iv, ciphertext, authTag);
    const reply = encryptSymmetric(keyDirectory[sessionId].symmetricKey, `Server successfully received and decrypted: ${decrypted}`);
    
    res.json({ success: true, reply });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = { app, worker, runWorkerTask };

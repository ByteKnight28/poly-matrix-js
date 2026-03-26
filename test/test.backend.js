const test = require('tape');
const http = require('http');
const { app, worker, runWorkerTask } = require('../backend/server');
const { encryptSymmetric, decryptSymmetric } = require('../backend/cipher');

let server;
let url;

test('Setting up integration testing server', t => {
  server = http.createServer(app);
  server.listen(0, () => {
    url = `http://localhost:${server.address().port}`;
    t.ok(url, 'Server successfully booted for testing on transient port');
    t.end();
  });
});

test('Simulating Alice to Bob ML-KEM exchange and Symmetric Payload', async t => {
  // Alice fetches the server's public key (Bob acts as dir)
  let res = await fetch(`${url}/key`);
  let json = await res.json();
  
  t.ok(json.sessionId, 'Session generated');
  t.ok(json.ek, 'Public key returned as base64');
  
  const ek = new Uint8Array(Buffer.from(json.ek, 'base64'));
  const sessionId = json.sessionId;
  
  // Alice uses the worker locally to encapsulate the shared secret K and ciphertext c using Bob's ek
  const encapsResult = await runWorkerTask({
    type: 'encaps',
    ek: ek,
    paramSet: 'ML-KEM-512'
  });
  
  const aliceK = encapsResult.K; // Alice's derivation wrapper payload
  const cBase64 = Buffer.from(encapsResult.c).toString('base64');
  
  // Alice dispatches Ciphertext back to Bob
  res = await fetch(`${url}/handshake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, cBase64 })
  });
  let handshakeJson = await res.json();
  t.ok(handshakeJson.success, 'Bob successfully decoded symmetric ciphertext via Decaps');
  
  // Alice verifies Bob's Ack
  let ackData = handshakeJson.ack;
  let decodedAck = decryptSymmetric(aliceK, ackData.iv, ackData.ciphertext, ackData.authTag);
  t.equal(JSON.parse(decodedAck).message, "Handshake verified securely.", 'Alice dynamically decoded message successfully verifying identically synchronized Session keys');
  
  // Alice encrypts final secure message to Bob
  let secretMessage = "This is a confidential payload!";
  let payload = encryptSymmetric(aliceK, secretMessage);
  
  res = await fetch(`${url}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...payload })
  });
  let finalJson = await res.json();
  
  t.ok(finalJson.success, 'Bob ingested fully symmetric transmission successfully');
  let finalServerReply = decryptSymmetric(aliceK, finalJson.reply.iv, finalJson.reply.ciphertext, finalJson.reply.authTag);
  t.equal(finalServerReply, `Server successfully received and decrypted: ${secretMessage}`, 'Data transit and synchronization passed seamlessly!');
  
  t.end();
});

test('Clean up', t => {
  server.close();
  worker.terminate();
  t.end();
});

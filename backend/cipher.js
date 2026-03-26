const crypto = require('crypto');

/**
 * Encrypt a utf8 plaintext payload using AES-256-GCM.
 * 
 * @param {Uint8Array} key - 32-byte shared secret from ML-KEM decapsulation. 
 * @param {string} plaintext - Message to symmetrically encrypt.
 * @returns {Object} Hex-encoded IV, Ciphertext, and Authentication Tag.
 */
function encryptSymmetric(key, plaintext) {
  const keyBuffer = Buffer.from(key.buffer, key.byteOffset, key.byteLength);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt a payload using AES-256-GCM.
 * 
 * @param {Uint8Array} key - 32-byte shared secret.
 * @param {string} ivHex - Hex encoded Initialization Vector.
 * @param {string} ciphertextHex - Hex encrypted blob.
 * @param {string} authTagHex - Hex encoded auth tag for GCM integrity check.
 * @returns {string} The decrypted UTF-8 plaintext message.
 */
function decryptSymmetric(key, ivHex, ciphertextHex, authTagHex) {
  const keyBuffer = Buffer.from(key.buffer, key.byteOffset, key.byteLength);
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  try {
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Symmetric AEAD Decryption completely failed! Ciphertext manipulated or keys mismatched.');
  }
}

module.exports = {
  encryptSymmetric,
  decryptSymmetric
};

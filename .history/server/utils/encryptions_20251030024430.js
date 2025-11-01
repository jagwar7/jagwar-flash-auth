const crypto  = require('crypto');

const algorithm = 'aes-256-cbc';
const encryption_key = process.env.CRYPTO_ENCRYPTION_KEY;
const iv_length = 16;


function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// Usage
const credential = 'my-secret-api-key-12345';
const encryptedCredential = encrypt(credential);
console.log('Encrypted:', encryptedCredential);
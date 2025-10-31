// // utils/encryptions.js
// import crypto from 'crypto';
// import 'dotenv/config';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get key from .env
const RAW_KEY = process.env.CRYPTO_ENCRYPTION_KEY?.trim();

if (!RAW_KEY) {
  throw new Error('Missing CRYPTO_ENCRYPTION_KEY in .env');
}
if (RAW_KEY.length !== 64) {
  throw new Error(`Key must be 64 chars, got ${RAW_KEY.length}. Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
}

const ENCRYPTION_KEY = Buffer.from(RAW_KEY, 'hex');

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  if (!ivHex || !encrypted) throw new Error('Invalid format');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
// utils/encryptions.js
import crypto from 'crypto';
import 'dotenv/config';               // <-- loads .env **before** using process.env

// ---------------------------------------------------------------------
// 1. CONFIGURATION – must be set in .env
// ---------------------------------------------------------------------
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;                     // 16 bytes = 128-bit IV

// Expect a **64-character hex string** (32 bytes) in .env
const RAW_KEY = process.env.CRYPTO_ENCRYPTION_KEY?.trim();

if (!RAW_KEY || RAW_KEY.length !== 64) {
  throw new Error(
    'CRYPTO_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) in .env'
  );
}

// Convert the hex string → Buffer (32 bytes)
const ENCRYPTION_KEY = Buffer.from(RAW_KEY, 'hex');

// ---------------------------------------------------------------------
// 2. ENCRYPT
// ---------------------------------------------------------------------
export function encrypt(plainText) {
  if (typeof plainText !== 'string') throw new Error('plainText must be a string');

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // iv:encrypted  (both hex)
  return `${iv.toString('hex')}:${encrypted}`;
}

// ---------------------------------------------------------------------
// 3. DECRYPT
// ---------------------------------------------------------------------
export function decrypt(cipherText) {
  const [ivHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted format (iv:encrypted)');

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let plain = decipher.update(encryptedHex, 'hex', 'utf8');
  plain += decipher.final('utf8');

  return plain;
}
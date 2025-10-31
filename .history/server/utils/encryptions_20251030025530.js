import crypto from cy
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.CRYPTO_ENCRYPTION_KEY;
const IV_LENGTH = 16;


export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}



export function decrypt(encryptedText) {
  const [iv, encrypted] = encryptedText.split(':');
  if (!iv || !encrypted) throw new Error('Invalid encrypted format');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

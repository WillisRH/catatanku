import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY environment variable is not set');
const KEY: string = ENCRYPTION_KEY;

export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(KEY, salt, ITERATIONS, KEY_LENGTH, 'sha512');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  const buffer = Buffer.from(encryptedText, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const text = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(KEY, salt, ITERATIONS, KEY_LENGTH, 'sha512');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(text) + decipher.final('utf8');
}

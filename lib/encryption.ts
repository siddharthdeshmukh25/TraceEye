import crypto from 'crypto';

// Use server-side only environment variable - no NEXT_PUBLIC_ prefix
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'traceeye-aes-256-key-change-in-production-min-32-chars!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Key derivation function to ensure key is exactly 32 bytes (256 bits)
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM
 * @param payload - String data to encrypt
 * @returns Base64 encoded encrypted string with salt, IV, and auth tag
 */
export function encryptData(payload: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password and salt
    const key = deriveKey(ENCRYPTION_KEY, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(payload, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'binary')]);
    
    // Return as base64
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedString - Base64 encoded encrypted string
 * @returns Decrypted original string
 * @throws Error if decryption fails (invalid key, tampered data, etc.)
 */
export function decryptData(encryptedString: string): string {
  try {
    // Decode base64
    const combined = Buffer.from(encryptedString, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
    const tag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.slice(ENCRYPTED_POSITION);
    
    // Derive key from password and salt
    const key = deriveKey(ENCRYPTION_KEY, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed - data may be tampered or invalid');
  }
}

/**
 * Verify if a string can be successfully decrypted
 * @param encryptedString - Base64 encoded encrypted string
 * @returns true if decryption succeeds, false otherwise
 */
export function verifyIntegrity(encryptedString: string): boolean {
  try {
    decryptData(encryptedString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create encrypted QR payload for batch
 * @param batchId - Public batch ID
 * @returns Encrypted base64 string
 */
export function createQRPayload(batchId: string): string {
  const payload = JSON.stringify({
    batchId: batchId,
    timestamp: Date.now(),
    version: '1.0'
  });
  return encryptData(payload);
}

/**
 * Decrypt and parse QR payload
 * @param encryptedString - Base64 encoded encrypted string
 * @returns Parsed batch ID and metadata
 * @throws Error if decryption fails or payload is invalid
 */
export function parseQRPayload(encryptedString: string): { batchId: string; timestamp: number; version: string } {
  try {
    const decrypted = decryptData(encryptedString);
    const payload = JSON.parse(decrypted);
    
    // Validate payload structure
    if (!payload.batchId || !payload.timestamp) {
      throw new Error('Invalid payload structure');
    }
    
    // Check if payload is too old (optional security measure)
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (Date.now() - payload.timestamp > maxAge) {
      throw new Error('QR payload expired');
    }
    
    return {
      batchId: payload.batchId,
      timestamp: payload.timestamp,
      version: payload.version || '1.0'
    };
  } catch (error) {
    console.error('QR payload parsing error:', error);
    throw new Error('Invalid or tampered QR code');
  }
}
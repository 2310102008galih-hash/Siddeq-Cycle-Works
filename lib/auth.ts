import crypto from 'crypto';

/**
 * Hash a password using PBKDF2 with SHA-512 and a random salt.
 * This is native to Node.js, secure, and requires no external binary compilation.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash.
 */
export function verifyPassword(password: string, passwordHash: string): boolean {
  try {
    const [salt, originalHash] = passwordHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

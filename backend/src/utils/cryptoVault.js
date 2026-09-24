const crypto = require('crypto');

/**
 * Enterprise Cryptographic Vault & PII Data Masking Utility (SRS Section 26 - Enterprise Security)
 * Implements AES-256-GCM field encryption, HMAC hashing, and regulatory data masking.
 */

// Encryption Key derived from JWT_SECRET or fallback
const MASTER_SECRET = process.env.JWT_SECRET || 'policysphere_secure_master_encryption_key_2026';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

class CryptoVault {
  /**
   * Encrypt sensitive PII (Aadhaar, PAN, Bank Account Number) using AES-256-GCM
   */
  static encrypt(plaintext) {
    if (!plaintext) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt AES-256-GCM ciphertext
   */
  static decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.includes(':')) {
      return ciphertext;
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) return ciphertext;

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.warn('Decryption failed, returning raw input:', err.message);
      return ciphertext;
    }
  }

  /**
   * Generates irreversible SHA-256 hash for duplicate identity detection
   */
  static generateIdentityHash(identifier) {
    if (!identifier) return null;
    return crypto.createHash('sha256').update(String(identifier).trim().toUpperCase()).digest('hex');
  }

  /**
   * PII Data Masking Functions for UI Display & Export (DPDP Act & IRDAI Guidelines)
   */
  static maskAadhaar(aadhaar) {
    if (!aadhaar) return 'XXXX-XXXX-XXXX';
    const clean = String(aadhaar).replace(/[^0-9]/g, '');
    if (clean.length < 4) return 'XXXX-XXXX-' + clean;
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }

  static maskPan(pan) {
    if (!pan) return 'XXXXX****X';
    const clean = String(pan).toUpperCase().trim();
    if (clean.length !== 10) return 'XXXXX****X';
    return `${clean.slice(0, 5)}****${clean.slice(-1)}`;
  }

  static maskPhone(phone) {
    if (!phone) return '+91 XXXXX ****X';
    const clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length < 4) return clean;
    const last2 = clean.slice(-2);
    const prefix = clean.slice(0, 2);
    return `+${prefix} XXXXX-XX${last2}`;
  }

  static maskEmail(email) {
    if (!email || !email.includes('@')) return 'u***@policysphere.com';
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
  }

  static maskBankAccount(acc) {
    if (!acc) return 'XXXXXXXX0000';
    const clean = String(acc).trim();
    if (clean.length < 4) return 'XXXX' + clean;
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
}

module.exports = CryptoVault;

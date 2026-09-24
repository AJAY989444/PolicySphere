const crypto = require('crypto');
const prisma = require('../config/db');

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function canonicalJson(obj) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') + '}';
}

class AuditVaultService {
  /**
   * Computes SHA-256 hash for an audit record block
   */
  static calculateRecordHash({
    previousHash,
    action,
    entityType,
    entityId,
    userId,
    previousValue,
    newValue,
    createdAt,
  }) {
    const payload = [
      previousHash || GENESIS_HASH,
      action,
      entityType,
      entityId || 'NONE',
      userId || 'SYSTEM',
      canonicalJson(previousValue),
      canonicalJson(newValue),
      createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString(),
    ].join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Append a new cryptographically chained audit record (SRS Module 35)
   */
  static async appendRecord({
    userId = null,
    action,
    entityType,
    entityId = null,
    req = null,
    previousValue = null,
    newValue = null,
    status = 'SUCCESS',
  }) {
    try {
      let ipAddress = '127.0.0.1';
      let userAgent = 'System Internal';

      if (req) {
        ipAddress =
          req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.connection?.remoteAddress ||
          req.ip ||
          '127.0.0.1';
        userAgent = req.headers['user-agent'] || 'Unknown Client';
      }

      // 1. Fetch latest cryptographically chained record in ledger to obtain previousHash
      const latestChainedRecord = await prisma.auditLog.findFirst({
        where: { recordHash: { not: null } },
        orderBy: { createdAt: 'desc' },
      });

      const previousHash = latestChainedRecord ? latestChainedRecord.recordHash : GENESIS_HASH;
      const createdAt = new Date();

      // 2. Compute cryptographic record hash
      const recordHash = this.calculateRecordHash({
        previousHash,
        action,
        entityType,
        entityId,
        userId,
        previousValue,
        newValue,
        createdAt,
      });

      // 3. Persist immutable record into database
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          ipAddress,
          userAgent,
          previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : undefined,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
          previousHash,
          recordHash,
          status,
          createdAt,
        },
      });
    } catch (err) {
      console.error('AuditVault appendRecord error:', err.message);
      return null;
    }
  }

  /**
   * Full cryptographic verification of the audit chain (SRS Module 35)
   * Detects database tampering, modified rows, or deleted log entries
   */
  static async verifyChainIntegrity() {
    const logs = await prisma.auditLog.findMany({
      where: { recordHash: { not: null } },
      orderBy: { createdAt: 'asc' },
    });

    if (logs.length === 0) {
      return {
        isIntact: true,
        status: 'EMPTY_LEDGER',
        totalVerified: 0,
        message: 'Audit ledger is empty; genesis state intact.',
        verifiedAt: new Date().toISOString(),
      };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];

      // If record doesn't have cryptographic hashes yet (legacy record), backfill or verify
      if (!record.recordHash) {
        continue;
      }

      // 1. Verify link to previous block
      if (record.previousHash && record.previousHash !== expectedPrevHash && i > 0) {
        return {
          isIntact: false,
          status: 'TAMPER_DETECTED_BROKEN_CHAIN',
          brokenBlockIndex: i,
          recordId: record.id,
          expectedPreviousHash: expectedPrevHash,
          actualPreviousHash: record.previousHash,
          message: `Cryptographic link severed at record index ${i} (ID: ${record.id})`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // 2. Re-calculate SHA-256 hash to ensure contents haven't been tampered with
      const recomputedHash = this.calculateRecordHash({
        previousHash: record.previousHash || GENESIS_HASH,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        userId: record.userId,
        previousValue: record.previousValue,
        newValue: record.newValue,
        createdAt: record.createdAt,
      });

      if (recomputedHash !== record.recordHash) {
        return {
          isIntact: false,
          status: 'TAMPER_DETECTED_HASH_MISMATCH',
          brokenBlockIndex: i,
          recordId: record.id,
          message: `Record content tampering detected at index ${i}. Content hash does not match immutable block signature.`,
          verifiedAt: new Date().toISOString(),
        };
      }

      expectedPrevHash = record.recordHash;
    }

    return {
      isIntact: true,
      status: 'VERIFIED_CRYPTOGRAPHICALLY_INTACT',
      totalVerified: logs.length,
      latestBlockHash: logs[logs.length - 1].recordHash || expectedPrevHash,
      message: 'All audit ledger records mathematically verified. 0 tampering or gaps detected.',
      verifiedAt: new Date().toISOString(),
    };
  }
}

module.exports = AuditVaultService;

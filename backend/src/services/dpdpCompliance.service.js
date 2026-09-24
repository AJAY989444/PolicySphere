const prisma = require('../config/db');
const CryptoVault = require('../utils/cryptoVault');
const eventBusService = require('./eventBus.service');

const STANDARD_CONSENT_PURPOSES = [
  {
    purpose: 'MARKETING_COMMUNICATION',
    title: 'Marketing & Promotional Communications',
    description: 'Periodic email, SMS, and WhatsApp alerts regarding renewal discounts, new policy launches, and tax saver offers.',
    isMandatory: false,
    defaultStatus: 'GRANTED',
  },
  {
    purpose: 'HEALTH_DATA_PROCESSING',
    title: 'Health & Medical Record Processing',
    description: 'Processing medical history, diagnostic reports, and hospital records for underwriting and cashless claim adjudication.',
    isMandatory: true,
    defaultStatus: 'GRANTED',
  },
  {
    purpose: 'INSURER_UNDERWRITING_SHARING',
    title: 'Third-Party Insurer Data Exchange',
    description: 'Secure transmission of proposal data to partner insurance underwriters (e.g. Star Health, HDFC ERGO) for policy binding.',
    isMandatory: true,
    defaultStatus: 'GRANTED',
  },
  {
    purpose: 'AUTO_DEBIT_RENEWAL',
    title: 'Recurring Mandate & Auto-Debit',
    description: 'Automated policy renewal debit on premium due date to prevent coverage lapse.',
    isMandatory: false,
    defaultStatus: 'REVOKED',
  },
  {
    purpose: 'NOMINEE_DATA_ACCESS',
    title: 'Nominee Identity & Settlement Access',
    description: 'Accessing nominated beneficiary contact information in the event of death or accidental hospitalization claims.',
    isMandatory: false,
    defaultStatus: 'GRANTED',
  },
];

class DpdpComplianceService {
  /**
   * Fetch all user consents with purpose descriptions and current state
   */
  static async getUserConsents(userId) {
    const recordedConsents = await prisma.userConsent.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const recordedMap = new Map();
    recordedConsents.forEach((c) => recordedMap.set(c.purpose, c));

    return STANDARD_CONSENT_PURPOSES.map((p) => {
      const recorded = recordedMap.get(p.purpose);
      return {
        purpose: p.purpose,
        title: p.title,
        description: p.description,
        isMandatory: p.isMandatory,
        status: recorded ? recorded.status : p.defaultStatus,
        grantedAt: recorded?.grantedAt || new Date().toISOString(),
        revokedAt: recorded?.revokedAt || null,
        version: recorded?.version || 'v2023.1',
      };
    });
  }

  /**
   * Update or grant/revoke a specific consent purpose (DPDP Section 6)
   */
  static async updateConsent(userId, purpose, status, metadata = {}) {
    const existing = await prisma.userConsent.findFirst({
      where: { userId, purpose },
    });

    const isRevocation = status === 'REVOKED';
    let consent;

    if (existing) {
      consent = await prisma.userConsent.update({
        where: { id: existing.id },
        data: {
          status,
          revokedAt: isRevocation ? new Date() : null,
          ipAddress: metadata.ip || null,
          userAgent: metadata.userAgent || null,
        },
      });
    } else {
      consent = await prisma.userConsent.create({
        data: {
          userId,
          purpose,
          status,
          revokedAt: isRevocation ? new Date() : null,
          ipAddress: metadata.ip || null,
          userAgent: metadata.userAgent || null,
          version: 'v2023.1',
        },
      });
    }

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: isRevocation ? 'USER_STATUS_TOGGLED' : 'USER_ROLE_UPDATED',
        entityType: 'UserConsent',
        entityId: consent.id,
        ipAddress: metadata.ip || '127.0.0.1',
        userAgent: metadata.userAgent || 'PolicySphere-Web',
        previousValue: existing ? { status: existing.status } : null,
        newValue: { status, purpose },
      },
    }).catch(() => {});

    eventBusService.emitDomainEvent('CONSENT_UPDATED', {
      userId,
      purpose,
      status,
      timestamp: new Date().toISOString(),
    });

    return consent;
  }

  /**
   * Export Personal Data Dossier (DPDP Section 12 Right to Access & Portability)
   */
  static async exportPersonalDataDossier(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPolicies: {
          include: {
            policy: { select: { name: true, category: true, provider: true, coverageAmount: true } },
            claims: true,
          },
        },
        payments: true,
        consents: true,
        erasureRequests: true,
      },
    });

    if (!user) {
      throw new Error('User record not found');
    }

    // Mask PII according to regulatory standards
    return {
      dossierMetadata: {
        exportDate: new Date().toISOString(),
        regulatoryStandard: 'Digital Personal Data Protection Act (DPDP India 2023)',
        complianceOfficer: 'dataprivacy@policysphere.com',
        retentionObligations: 'Under IRDAI AML regulations, financial and policy issuance transactions must be retained for 10 years.',
      },
      personalProfile: {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: CryptoVault.maskEmail(user.email),
        phone: CryptoVault.maskPhone(user.phone),
        role: user.role,
        accountCreated: user.createdAt,
      },
      consentsTracked: user.consents.map((c) => ({
        purpose: c.purpose,
        status: c.status,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
      })),
      policyPortfolio: user.userPolicies.map((up) => ({
        policyNumber: up.policyNumber,
        policyName: up.policy.name,
        category: up.policy.category,
        provider: up.policy.provider,
        coverageAmount: up.policy.coverageAmount,
        premiumPaid: up.premiumPaid,
        startDate: up.startDate,
        endDate: up.endDate,
        status: up.status,
        claimsHistory: up.claims.map((cl) => ({
          claimNumber: cl.claimNumber,
          amount: cl.amount,
          status: cl.status,
          filedDate: cl.createdAt,
        })),
      })),
      transactionLedger: user.payments.map((p) => ({
        transactionRef: p.transactionRef,
        amount: p.amount,
        status: p.paymentStatus,
        method: p.paymentMethod,
        date: p.createdAt,
      })),
      erasureRequests: user.erasureRequests,
    };
  }

  /**
   * Submit a Right-to-Erasure Request (DPDP Section 12 Right to Correction & Erasure)
   */
  static async submitErasureRequest(userId, reason) {
    // Check if user has active in-review claims
    const activeClaims = await prisma.claim.count({
      where: {
        userPolicy: { userId },
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    });

    if (activeClaims > 0) {
      const err = new Error('Cannot request data erasure while you have active claims undergoing investigation.');
      err.statusCode = 400;
      throw err;
    }

    const request = await prisma.dataErasureRequest.create({
      data: {
        userId,
        reason,
        status: 'PENDING_REVIEW',
      },
    });

    // Revoke all non-mandatory marketing consents immediately
    await prisma.userConsent.updateMany({
      where: { userId, purpose: 'MARKETING_COMMUNICATION' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    return request;
  }

  /**
   * Get all erasure requests for Compliance Officer review
   */
  static async getErasureRequests() {
    return prisma.dataErasureRequest.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}

module.exports = DpdpComplianceService;

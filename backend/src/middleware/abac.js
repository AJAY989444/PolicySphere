/**
 * Attribute-Based Access Control (ABAC) Policy Evaluator (SRS Section 26)
 * Evaluates dynamic contextual attributes (Subject, Resource, Action, Environment)
 * for fine-grained authorization beyond static RBAC.
 */

class AbacEngine {
  constructor() {
    this.policies = new Map();
    this.registerStandardPolicies();
  }

  registerPolicy(name, evaluatorFn) {
    this.policies.set(name, evaluatorFn);
  }

  evaluate(policyName, context) {
    const evaluator = this.policies.get(policyName);
    if (!evaluator) {
      console.warn(`[ABAC] Unknown policy: ${policyName}`);
      return { allowed: false, reason: `Policy ${policyName} not defined` };
    }
    return evaluator(context);
  }

  registerStandardPolicies() {
    // 1. Claim Access Policy: Owner, Assigned Advisor, or Admin
    this.registerPolicy('CAN_ACCESS_CLAIM', ({ subject, resource }) => {
      if (!subject || !subject.isActive) return { allowed: false, reason: 'Account inactive or unauthenticated' };
      if (subject.role === 'ADMIN') return { allowed: true, reason: 'Admin platform clearance' };
      if (subject.role === 'ADVISOR') return { allowed: true, reason: 'Advisor claims review authorization' };
      if (resource?.userId === subject.id) return { allowed: true, reason: 'Resource owner' };
      return { allowed: false, reason: 'Access denied: User does not own this claim record' };
    });

    // 2. Sensitive Health Data Processing Policy: Requires DPDP Consent
    this.registerPolicy('CAN_PROCESS_HEALTH_DATA', ({ subject, consentGranted }) => {
      if (subject.role === 'ADMIN') return { allowed: true, reason: 'Administrative statutory compliance' };
      if (consentGranted === true) return { allowed: true, reason: 'Active DPDP Section 6 explicit consent' };
      return { allowed: false, reason: 'Missing explicit DPDP consent for Health Data Processing' };
    });

    // 3. High-Value Financial Disbursal Policy: Claims > 2 Lakh require Admin role
    this.registerPolicy('CAN_DISBURSE_PAYOUT', ({ subject, resource }) => {
      const amount = resource?.amount || 0;
      if (amount > 200000 && subject.role !== 'ADMIN') {
        return { allowed: false, reason: 'Disbursals above INR 2,00,000 require Super Admin dual authorization' };
      }
      if (subject.role === 'ADMIN' || subject.role === 'ADVISOR') {
        return { allowed: true, reason: 'Authorized reviewer' };
      }
      return { allowed: false, reason: 'Insufficient privileges for payout settlement' };
    });

    // 4. Data Erasure Policy: Cannot erase accounts with active claims in dispute
    this.registerPolicy('CAN_REQUEST_ERASURE', ({ subject, activeClaimsCount }) => {
      if (activeClaimsCount > 0) {
        return { allowed: false, reason: 'Cannot process erasure while active claims or dispute audits are open' };
      }
      return { allowed: true, reason: 'Eligible for right-to-erasure evaluation under DPDP Act' };
    });
  }
}

const abacEngine = new AbacEngine();

/**
 * Express middleware helper enforcing an ABAC policy
 */
const requireAbacPolicy = (policyName, contextExtractor) => {
  return (req, res, next) => {
    const subject = req.user;
    const extractedContext = contextExtractor ? contextExtractor(req) : {};

    const context = {
      subject,
      ...extractedContext,
      environment: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      },
    };

    const evaluation = abacEngine.evaluate(policyName, context);
    if (!evaluation.allowed) {
      return res.status(403).json({
        success: false,
        message: evaluation.reason,
        policyEvaluated: policyName,
      });
    }

    req.abacEvaluation = evaluation;
    next();
  };
};

module.exports = {
  abacEngine,
  requireAbacPolicy,
};

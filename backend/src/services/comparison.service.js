const prisma = require('../config/db');

class ComparisonService {
  /**
   * Helper to compute AI Value Score (0 - 100)
   * Evaluates coverage-to-cost ratio, CSR %, and solvency ratio.
   */
  static calculateAiValueScore(policy, metrics) {
    // 1. Value ratio (Coverage per dollar of annual premium)
    const annualPremium = policy.premium || 1;
    const valueRatio = policy.coverageAmount / annualPremium;
    // Normalize value ratio (cap at 40 points)
    const valueScore = Math.min(40, (valueRatio / 250) * 40);

    // 2. Claim Settlement Ratio component (max 35 points)
    const csrScore = ((metrics.claimSettlementRatio - 80) / 20) * 35; // Assuming CSR scale 80%-100%

    // 3. Solvency ratio & Network density (max 25 points)
    const solvencyScore = Math.min(15, (metrics.solvencyRatio / 2.0) * 15);
    const networkScore = Math.min(10, (metrics.networkDensity.count / 12000) * 10);

    const totalScore = Math.round(valueScore + csrScore + solvencyScore + networkScore);
    return Math.max(50, Math.min(99, totalScore)); // Clamp between 50 and 99
  }

  /**
   * Helper to derive provider benchmarks based on policy provider or category.
   */
  static getProviderMetrics(provider, category) {
    const p = (provider || '').toLowerCase();
    const c = (category || '').toLowerCase();

    // Default baseline metrics per provider type
    let csr = 98.2;
    let solvency = 1.85;
    let networkCount = 10500;
    let cashlessSpeed = '30 mins';

    if (p.includes('care') || p.includes('star') || p.includes('hdfc')) {
      csr = 99.1;
      solvency = 2.1;
      networkCount = 12500;
      cashlessSpeed = '15 mins';
    } else if (p.includes('icici') || p.includes('tata') || p.includes('bajaj')) {
      csr = 98.6;
      solvency = 1.95;
      networkCount = 11200;
      cashlessSpeed = '20 mins';
    } else if (p.includes('lic') || p.includes('max') || p.includes('sbi')) {
      csr = 97.9;
      solvency = 1.80;
      networkCount = 9800;
      cashlessSpeed = '45 mins';
    }

    // Category specific additions
    let waitingPeriods = {
      initial: '30 Days',
      preExisting: c.includes('health') ? '24 Months' : 'N/A',
      specificIllness: c.includes('health') ? '12 Months' : 'N/A',
    };

    let taxBenefits = c.includes('health')
      ? 'Section 80D (Up to ₹75,000)'
      : c.includes('life')
      ? 'Section 80C & 10(10D)'
      : 'Business Tax Deduction (Sec 37)';

    let exclusions = c.includes('health')
      ? ['Cosmetic Surgery', 'Self-inflicted Injuries', 'Unproven Treatments']
      : c.includes('vehicle') || c.includes('auto')
      ? ['Normal Wear & Tear', 'Driving under influence', 'Consequential Loss']
      : c.includes('life')
      ? ['Suicide in 1st year', 'War/Radiation risks', 'Hazardous sports without rider']
      : ['Wear & Tear', 'Gross Negligence'];

    return {
      claimSettlementRatio: csr,
      solvencyRatio: solvency,
      networkDensity: {
        count: networkCount,
        label: c.includes('vehicle') || c.includes('auto') ? 'Network Garages' : 'Cashless Hospitals',
      },
      cashlessSpeed,
      waitingPeriods,
      taxBenefits,
      exclusions,
    };
  }

  /**
   * Compare policies by IDs (up to 4 policies)
   */
  static async comparePolicies(policyIds) {
    if (!Array.isArray(policyIds) || policyIds.length === 0) {
      const error = new Error('policyIds must be a non-empty array');
      error.status = 400;
      throw error;
    }

    if (policyIds.length > 4) {
      const error = new Error('Maximum of 4 policies can be compared simultaneously');
      error.status = 400;
      throw error;
    }

    const policies = await prisma.insurancePolicy.findMany({
      where: {
        id: { in: policyIds },
      },
    });

    if (policies.length === 0) {
      const error = new Error('No policies found for provided IDs');
      error.status = 404;
      throw error;
    }

    // Preserve order as requested in policyIds array
    const policyMap = new Map(policies.map(p => [p.id, p]));
    const orderedPolicies = policyIds.map(id => policyMap.get(id)).filter(Boolean);

    // Enrich each policy with decision metrics
    const enrichedPolicies = orderedPolicies.map(policy => {
      const metrics = ComparisonService.getProviderMetrics(policy.provider, policy.category);
      const aiValueScore = ComparisonService.calculateAiValueScore(policy, metrics);

      return {
        ...policy,
        metrics: {
          ...metrics,
          aiValueScore,
        },
      };
    });

    // Identify highest AI Value Score policy
    let maxScore = -1;
    let bestValuePolicyId = null;
    enrichedPolicies.forEach(p => {
      if (p.metrics.aiValueScore > maxScore) {
        maxScore = p.metrics.aiValueScore;
        bestValuePolicyId = p.id;
      }
    });

    enrichedPolicies.forEach(p => {
      p.isBestValue = p.id === bestValuePolicyId;
    });

    return {
      comparedCount: enrichedPolicies.length,
      bestValuePolicyId,
      policies: enrichedPolicies,
    };
  }
}

module.exports = ComparisonService;

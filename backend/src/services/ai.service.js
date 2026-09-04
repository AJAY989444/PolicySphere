const prisma = require('../config/db');

class AIService {
  /**
   * Process natural language query and recommend matched policies or FAQ response.
   */
  static async processChatQuery(userMessage, conversationHistory = []) {
    const text = userMessage.toLowerCase();

    // Fetch active policies for matching
    const policies = await prisma.insurancePolicy.findMany({
      where: { isActive: true },
    });

    let reply = '';
    let recommendedPolicies = [];

    // Category detection
    let matchedCategory = null;
    if (text.includes('health') || text.includes('hospital') || text.includes('medical') || text.includes('doctor')) {
      matchedCategory = 'HEALTH';
    } else if (text.includes('life') || text.includes('term') || text.includes('death') || text.includes('family security')) {
      matchedCategory = 'LIFE';
    } else if (text.includes('motor') || text.includes('car') || text.includes('bike') || text.includes('vehicle') || text.includes('auto')) {
      matchedCategory = 'MOTOR';
    } else if (text.includes('travel') || text.includes('flight') || text.includes('trip') || text.includes('abroad')) {
      matchedCategory = 'TRAVEL';
    } else if (text.includes('home') || text.includes('house') || text.includes('tenant') || text.includes('rent')) {
      matchedCategory = 'HOME';
    }

    // Recommendation or Risk query triggers
    if (text.includes('risk') || text.includes('score') || text.includes('advisor') || text.includes('calculator')) {
      reply = "Our **Smart Advisor** uses dynamic risk profiling and multi-factor scoring! You can run a full personalized assessment on the Smart Advisor Hub to get exact risk tiers and custom matches.";
      recommendedPolicies = policies.slice(0, 3).map(p => ({ ...p, matchScore: Math.floor(Math.random() * 15 + 83) }));
    } else if (text.includes('fine print') || text.includes('explain') || text.includes('clause') || text.includes('hidden')) {
      reply = "PolicySphere AI automatically simplifies insurance fine print! Select any plan in the catalog and click **'Ask AI to Explain Fine Print'** for an instant breakdown of waiting periods, exclusions, and co-pays.";
      recommendedPolicies = policies.slice(0, 2).map(p => ({ ...p, matchScore: 92 }));
    } else if (text.includes('claim') || text.includes('how to claim')) {
      reply = "To submit an insurance claim on PolicySphere:\n1. Go to the Claims page from your top menu.\n2. Click 'Submit New Claim' and select your active policy.\n3. Upload incident details and evidence documents.\n4. Our advisor team will review and update your status within 24 hours!";
    } else if (text.includes('tax') || text.includes('80c') || text.includes('deduction')) {
      reply = "Yes! Insurance policies on PolicySphere offer substantial tax savings:\n• Health Insurance: Deduction up to ₹25,000 under Section 80D.\n• Life Insurance: Premiums tax-exempt up to ₹1,50,000 under Section 80C.\n• You can download your official tax certificate directly from your Dashboard!";
    } else if (text.includes('certificate') || text.includes('download')) {
      reply = "You can view and download your official Digital Policy Certificate anytime! Go to your Dashboard, locate your active policy, and click the 'Certificate' button to view or print as PDF.";
    } else if (matchedCategory) {
      recommendedPolicies = policies
        .filter((p) => p.category === matchedCategory)
        .slice(0, 3)
        .map((p, idx) => ({ ...p, matchScore: 95 - idx * 4 }));
      reply = `Here are our top recommended **${matchedCategory}** insurance plans tailored for your needs:`;
    } else if (text.includes('cheap') || text.includes('affordable') || text.includes('budget') || text.includes('low premium')) {
      recommendedPolicies = [...policies]
        .sort((a, b) => a.premium - b.premium)
        .slice(0, 3)
        .map((p, idx) => ({ ...p, matchScore: 94 - idx * 3 }));
      reply = "Here are our most budget-friendly insurance plans offering maximum value at low annual premiums:";
    } else {
      // Default intelligent response with curated recommendations
      recommendedPolicies = policies.slice(0, 3).map((p, idx) => ({ ...p, matchScore: 91 - idx * 3 }));
      reply = "Hello! I am **SphereAI**, your 24/7 personal insurance advisor. I can help you find the best coverage, calculate dynamic risk scores, explain fine print, or answer tax benefit questions. Here are a few top-rated plans for you:";
    }

    return {
      reply,
      recommendedPolicies: recommendedPolicies.map((p) => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        category: p.category,
        premium: p.premium,
        coverageAmount: p.coverageAmount,
        matchScore: p.matchScore || 88,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
      })),
    };
  }

  /**
   * Calculate personalized recommendations with Match Score (0-100%) and rationale
   */
  static async calculatePersonalizedRecommendations(params) {
    const {
      age = 30,
      income = 800000,
      dependents = 0,
      medicalHistory = '',
      category = 'ALL',
      budget = 50000,
    } = params;

    const whereClause = { isActive: true };
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    const policies = await prisma.insurancePolicy.findMany({
      where: whereClause,
    });

    const evaluated = policies.map((policy) => {
      let score = 75;
      const rationaleItems = [];

      // Budget evaluation
      const numBudget = Number(budget) || 50000;
      if (policy.premium <= numBudget) {
        score += 12;
        rationaleItems.push(`Fits comfortably within your annual budget of ₹${numBudget.toLocaleString('en-IN')}`);
      } else {
        const excessRatio = (policy.premium - numBudget) / numBudget;
        score -= Math.min(25, Math.round(excessRatio * 20));
        rationaleItems.push(`Premium exceeds target budget slightly by ₹${(policy.premium - numBudget).toLocaleString('en-IN')}`);
      }

      // Age suitability
      const numAge = Number(age) || 30;
      if (policy.category === 'HEALTH') {
        if (numAge < 35) {
          score += 6;
          rationaleItems.push('Comprehensive young-adult health coverage with low entry age lock-in');
        } else {
          score += 4;
          rationaleItems.push('Provides high restored sum insured ideal for mid-life health protection');
        }
      } else if (policy.category === 'LIFE') {
        const numDependents = Number(dependents) || 0;
        if (numDependents > 0) {
          score += 10;
          rationaleItems.push(`High financial safety net tailored for supporting ${numDependents} dependent(s)`);
        }
      } else if (policy.category === 'MOTOR') {
        score += 5;
        rationaleItems.push('Includes cashless garage network & zero-depreciation rider support');
      }

      // Income vs Coverage ratio
      const numIncome = Number(income) || 600000;
      if (policy.coverageAmount >= numIncome * 3) {
        score += 8;
        rationaleItems.push(`Coverage of ₹${(policy.coverageAmount / 100000).toFixed(1)}L provides strong 3x+ income protection`);
      } else {
        score += 3;
        rationaleItems.push('Essential core coverage with option for top-up add-ons');
      }

      // Medical History penalty or match
      const medHistoryLower = (medicalHistory || '').toLowerCase();
      if (medHistoryLower.includes('diabetes') || medHistoryLower.includes('hypertension') || medHistoryLower.includes('heart')) {
        if (policy.description.toLowerCase().includes('comprehensive') || policy.description.toLowerCase().includes('care')) {
          score += 5;
          rationaleItems.push('Covers pre-existing condition management with reduced waiting window');
        }
      }

      const matchScore = Math.min(98, Math.max(48, Math.round(score)));

      return {
        id: policy.id,
        name: policy.name,
        provider: policy.provider,
        category: policy.category,
        description: policy.description,
        coverageAmount: policy.coverageAmount,
        premium: policy.premium,
        duration: policy.duration,
        features: typeof policy.features === 'string' ? JSON.parse(policy.features) : policy.features,
        matchScore,
        rationale: rationaleItems.join(' • '),
      };
    });

    // Sort by match score descending
    evaluated.sort((a, b) => b.matchScore - a.matchScore);

    return {
      totalEvaluated: evaluated.length,
      recommendations: evaluated,
    };
  }

  /**
   * Calculate dynamic risk score (0-100), risk tier, premium adjustment & mitigation tips
   */
  static async calculateRiskScore(params) {
    const {
      age = 30,
      smoker = false,
      preExistingConditions = false,
      drivingHistory = 'CLEAN', // CLEAN, MODERATE, ACCIDENTS
      vehicleAge = 2,
    } = params;

    let riskScore = 15;
    const breakdown = [];

    // Age factor
    const numAge = Number(age) || 30;
    if (numAge < 25) {
      riskScore += 18;
      breakdown.push({ factor: 'Age Bracket (<25)', impact: '+18 points', detail: 'Higher statistical probability of claims in younger demographic' });
    } else if (numAge > 50) {
      riskScore += 22;
      breakdown.push({ factor: 'Age Bracket (50+)', impact: '+22 points', detail: 'Elevated healthcare risk profile requiring broader coverage' });
    } else {
      riskScore += 8;
      breakdown.push({ factor: 'Age Bracket (25-50)', impact: '+8 points', detail: 'Optimal standard risk demographic' });
    }

    // Smoker status
    if (smoker === true || smoker === 'true') {
      riskScore += 25;
      breakdown.push({ factor: 'Tobacco Use', impact: '+25 points', detail: 'Substantial increase in respiratory & life underwriting risk' });
    } else {
      breakdown.push({ factor: 'Non-Smoker Status', impact: '0 points', detail: 'Eligible for non-tobacco preferred rate tiers' });
    }

    // Pre-existing conditions
    if (preExistingConditions === true || preExistingConditions === 'true') {
      riskScore += 20;
      breakdown.push({ factor: 'Pre-existing Medical Condition', impact: '+20 points', detail: 'Requires standard initial waiting period & tailored health add-ons' });
    }

    // Driving history
    if (drivingHistory === 'ACCIDENTS') {
      riskScore += 20;
      breakdown.push({ factor: 'Driving History (Prior Claims/Accidents)', impact: '+20 points', detail: 'Elevated motor loss ratio rating' });
    } else if (drivingHistory === 'MODERATE') {
      riskScore += 10;
      breakdown.push({ factor: 'Driving History (Minor Traffic Violations)', impact: '+10 points', detail: 'Moderate rating impact' });
    } else {
      breakdown.push({ factor: 'Clean Driving Record', impact: '0 points', detail: 'Qualifies for maximum No-Claim Bonus (NCB) discounts' });
    }

    // Vehicle Age
    const numVehicleAge = Number(vehicleAge) || 0;
    if (numVehicleAge > 5) {
      riskScore += 12;
      breakdown.push({ factor: `Vehicle Age (${numVehicleAge} yrs)`, impact: '+12 points', detail: 'Higher wear-and-tear & maintenance risk factor' });
    }

    const finalRiskScore = Math.min(99, Math.max(10, Math.round(riskScore)));

    let riskTier = 'LOW';
    let estimatedAdjustment = '-10% Preferred Discount';
    let riskTierColor = '#10b981'; // green

    if (finalRiskScore > 65) {
      riskTier = 'HIGH';
      estimatedAdjustment = '+25% Risk Premium Loading';
      riskTierColor = '#ef4444'; // red
    } else if (finalRiskScore >= 35) {
      riskTier = 'MODERATE';
      estimatedAdjustment = 'Standard Market Rate (0% Loading)';
      riskTierColor = '#f59e0b'; // amber
    }

    const mitigationTips = [];
    if (smoker) {
      mitigationTips.push('Complete 12-month smoking cessation program to reduce term life premium by up to 25%.');
    }
    if (drivingHistory !== 'CLEAN') {
      mitigationTips.push('Maintain a clean driving record for 1 year to unlock No-Claim-Bonus (NCB) tier discount.');
    }
    if (preExistingConditions) {
      mitigationTips.push('Opt for multi-year policy lock to waive annual waiting period escalation.');
    }
    mitigationTips.push('Combine Health & Term Life under a single family bundle for up to 15% multi-policy discount.');

    return {
      riskScore: finalRiskScore,
      riskTier,
      riskTierColor,
      estimatedAdjustment,
      breakdown,
      mitigationTips,
    };
  }

  /**
   * Plain-English breakdown of policy fine-print, exclusions, waiting periods & co-pays
   */
  static async explainPolicyFinePrint(policyId) {
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    const features = typeof policy.features === 'string' ? JSON.parse(policy.features) : (policy.features || []);

    let pros = [];
    let cons = [];
    let exclusions = [];
    let copayClause = '0% Co-payment at all network hospitals & empaneled centers.';
    let waitingPeriod = '30 days general waiting period (waived for accidental hospitalization).';
    let hiddenBenefits = [];

    if (policy.category === 'HEALTH') {
      pros = [
        '100% Cashless hospitalization at over 10,000+ empaneled hospitals nationwide.',
        'Automatic restoration of sum insured if baseline coverage is exhausted.',
        'Covers pre and post-hospitalization medical expenses up to 60/90 days.',
      ];
      cons = [
        'Room rent limit capped at 1% of sum insured per day unless upgraded rider is purchased.',
        'Initial 30-day waiting period applies for non-emergency illnesses.',
      ];
      exclusions = [
        'Cosmetic procedures, weight loss surgeries, and experimental therapies are non-claimable.',
        'Pre-existing illnesses have a standard 24-36 month waiting window.',
        'Injuries resulting from hazardous sports or unprescribed drug usage.',
      ];
      copayClause = '0% Co-payment for individuals under age 60; 10% co-pay applicable for senior citizen enrollments.';
      waitingPeriod = '30-day initial waiting window; 24 months for specified procedures like cataract or joint replacement.';
      hiddenBenefits = [
        'Complimentary annual full-body health checkups for all covered members.',
        'Tax deduction benefit under Section 80D up to ₹25,000 / year.',
      ];
    } else if (policy.category === 'LIFE') {
      pros = [
        'High guaranteed payout to nominees in the event of critical illness or untimely demise.',
        'Flexible payout options: Lump-sum or monthly income streams.',
        'Tax-free payout under Section 10(10D) of the Income Tax Act.',
      ];
      cons = [
        'No surrender value if lapsed within initial 2 years of inception.',
        'Premium rates lock strictly based on entry age and health declaration.',
      ];
      exclusions = [
        'Suicide clause excluded during the first 12 months of policy issuance.',
        'Death due to participation in illegal acts or undisclosed pre-existing terminal conditions.',
      ];
      copayClause = 'N/A (Life Insurance provides 100% claim payout without co-pay reductions).';
      waitingPeriod = 'Immediate coverage for accidental death; 45-day waiting period for natural illness death.';
      hiddenBenefits = [
        'Terminal Illness Rider included at zero extra cost (payout on diagnosis).',
        'Section 80C tax deduction benefits up to ₹1,50,000 annually.',
      ];
    } else if (policy.category === 'MOTOR') {
      pros = [
        'Zero-Depreciation coverage for plastic, rubber, and glass components.',
        '24x7 Roadside Assistance including towing, flat-tyre change, and battery jump-start.',
      ];
      cons = [
        'Standard compulsory deductible of ₹1,000 to ₹2,000 per claim apply.',
        'Consumable items (engine oil, nuts/bolts) covered only with add-on rider.',
      ];
      exclusions = [
        'Damage caused while driving without a valid driving license or under the influence of alcohol.',
        'Consequential electrical or mechanical breakdown without accidental collision.',
      ];
      copayClause = 'Compulsory deductible per claim as mandated by IRDAI regulations.';
      waitingPeriod = 'Immediate active coverage starting from midnight of policy issuance date.';
      hiddenBenefits = [
        'No-Claim Bonus (NCB) transferrable from any previous insurance provider up to 50%.',
        'Personal accident cover for owner-driver up to ₹15 Lakhs.',
      ];
    } else {
      pros = [
        'Comprehensive policy protection against unforeseen liabilities and incidents.',
        'Instant digital claim processing with hassle-free documentation.',
      ];
      cons = [
        'Specific claim sub-limits apply based on category selection.',
      ];
      exclusions = [
        'Willful negligence or intentional damage is strictly excluded.',
      ];
      copayClause = 'Standard policy terms apply.';
      waitingPeriod = 'Immediate active coverage from policy issuance date.';
      hiddenBenefits = [
        'Dedicated 24/7 SphereAI relationship advisor for priority claim assistance.',
      ];
    }

    return {
      policyId: policy.id,
      policyName: policy.name,
      provider: policy.provider,
      category: policy.category,
      coverageAmount: policy.coverageAmount,
      premium: policy.premium,
      pros,
      cons,
      exclusions,
      copayClause,
      waitingPeriod,
      hiddenBenefits,
      features,
      aiVerdict: `SphereAI Verdict: **${policy.name}** offers top-tier market value. It is highly recommended for users seeking robust ${policy.category.toLowerCase()} protection with seamless claim handling.`,
    };
  }
}

module.exports = AIService;


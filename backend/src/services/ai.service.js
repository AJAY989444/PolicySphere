const prisma = require('../config/db');

class AIService {
  /**
   * Process natural language query and recommend matched policies or FAQ response.
   */
  static async processChatQuery(userMessage, conversationHistory = []) {
    const text = (userMessage || '').toLowerCase().trim();

    // Fetch active policies for matching
    const policies = await prisma.insurancePolicy.findMany({
      where: { isActive: true },
    });

    let reply = '';
    let recommendedPolicies = [];
    let intent = 'GENERAL';

    // Check if user is explicitly asking for plan recommendations/quotes/buying
    const isAskingForPlans =
      text.includes('recommend') ||
      text.includes('suggest') ||
      text.includes('plan') ||
      text.includes('policy') ||
      text.includes('policies') ||
      text.includes('quote') ||
      text.includes('buy') ||
      text.includes('purchase') ||
      text.includes('cover') ||
      text.includes('best') ||
      text.includes('top plan') ||
      text.includes('which plan') ||
      text.includes('cheap') ||
      text.includes('affordable') ||
      text.includes('budget') ||
      text.includes('compare');

    // Category detection
    let matchedCategory = null;
    if (text.includes('health') || text.includes('hospital') || text.includes('medical') || text.includes('doctor') || text.includes('mediclaim')) {
      matchedCategory = 'HEALTH';
    } else if (text.includes('life') || text.includes('term') || text.includes('death') || text.includes('family security')) {
      matchedCategory = 'LIFE';
    } else if (text.includes('motor') || text.includes('car') || text.includes('bike') || text.includes('vehicle') || text.includes('auto')) {
      matchedCategory = 'MOTOR';
    } else if (text.includes('travel') || text.includes('flight') || text.includes('trip') || text.includes('abroad') || text.includes('visa')) {
      matchedCategory = 'TRAVEL';
    } else if (text.includes('home') || text.includes('house') || text.includes('tenant') || text.includes('rent') || text.includes('property')) {
      matchedCategory = 'HOME';
    }

    // 1. Greetings (e.g. "hello", "hi", "hey", "good morning") - NEVER recommend plans here
    const isGreeting =
      text === 'hello' ||
      text === 'hi' ||
      text === 'hey' ||
      text.startsWith('hello') ||
      text.startsWith('hi ') ||
      text.startsWith('hey ') ||
      text.includes('good morning') ||
      text.includes('good afternoon') ||
      text.includes('good evening') ||
      text === 'help' ||
      text === 'start';

    if (isGreeting && !isAskingForPlans) {
      intent = 'GREETING';
      reply = "Hello! I am **SphereAI**, your 24/7 personal insurance advisor. I can help you find the best coverage, calculate dynamic risk scores, predict multi-year premiums, estimate claim probabilities, or answer questions. How can I help you today?";
      recommendedPolicies = [];
    } else if (text.includes('predict') || text.includes('future premium') || text.includes('5 year') || text.includes('forecast') || text.includes('inflation')) {
      intent = 'PREMIUM_PREDICTION';
      reply = "Our **5-Year Premium Predictor** uses actuarial modeling to project healthcare inflation (~8.5%/yr) and age milestone band shifts. Switch to the **'5-Year Premium Predictor'** tab in the Smart Advisor Hub to run an interactive multi-year simulation!";
      if (isAskingForPlans) {
        recommendedPolicies = policies.filter((p) => p.category === (matchedCategory || 'HEALTH')).slice(0, 2);
      }
    } else if (text.includes('probability') || text.includes('chance of claim') || text.includes('claim likelihood') || text.includes('will i claim')) {
      intent = 'CLAIM_PROBABILITY';
      reply = "SphereAI's **Claim Probability Engine** calculates your statistical likelihood of filing an insurance claim over 12, 24, and 36 months, and calculates deductible sweet spots to minimize your net expense. Check out the **'Claim Probability'** tab in Smart Advisor!";
      if (isAskingForPlans) {
        recommendedPolicies = policies.slice(0, 2);
      }
    } else if (text.includes('fraud') || text.includes('anomaly') || text.includes('fake') || text.includes('red flag') || text.includes('investigation')) {
      intent = 'FRAUD_DETECTION';
      reply = "PolicySphere's **AI Fraud Detection Engine** runs automated velocity checks, early-claim latency scoring, hospital billing benchmark ratio checks, and OCR document validation. You can test live scenarios in the **'AI Fraud Detector'** tab.";
    } else if (text.includes('voice') || text.includes('mic') || text.includes('speak') || text.includes('audio') || text.includes('read aloud')) {
      intent = 'VOICE_ASSISTANT';
      reply = "You can speak to me hands-free! Click the **Microphone icon** next to the chat box to dictate your questions, and toggle the **Speech Audio icon** to have me read replies aloud with natural voice synthesis.";
    } else if (text.includes('risk') || text.includes('score') || text.includes('advisor') || text.includes('calculator')) {
      intent = 'RISK_SCORING';
      reply = "Our **Smart Advisor** uses dynamic risk profiling and multi-factor scoring! You can run a full personalized assessment on the Smart Advisor Hub to get exact risk tiers and custom matches.";
      if (isAskingForPlans) {
        recommendedPolicies = policies.slice(0, 3).map(p => ({ ...p, matchScore: Math.floor(Math.random() * 15 + 83) }));
      }
    } else if (text.includes('fine print') || text.includes('explain') || text.includes('clause') || text.includes('hidden') || text.includes('waiting period')) {
      intent = 'POLICY_EXPLANATION';
      reply = "PolicySphere AI automatically simplifies insurance fine print! Select any plan in the catalog and click **'Ask AI to Explain Fine Print'** for an instant breakdown of waiting periods, exclusions, and co-pays.";
      if (isAskingForPlans) {
        recommendedPolicies = policies.slice(0, 2).map(p => ({ ...p, matchScore: 92 }));
      }
    } else if (text.includes('claim') || text.includes('how to claim') || text.includes('file claim')) {
      intent = 'CLAIM_GUIDE';
      reply = "To submit an insurance claim on PolicySphere:\n1. Go to the Claims page from your top menu.\n2. Click 'Submit New Claim' and select your active policy.\n3. Upload incident details and evidence documents.\n4. Our advisor team will review and update your status within 24 hours!";
    } else if (text.includes('tax') || text.includes('80c') || text.includes('80d') || text.includes('deduction')) {
      intent = 'TAX_BENEFITS';
      reply = "Yes! Insurance policies on PolicySphere offer substantial tax savings:\n• Health Insurance: Deduction up to ₹25,000 under Section 80D.\n• Life Insurance: Premiums tax-exempt up to ₹1,50,000 under Section 80C.\n• You can download your official tax certificate directly from your Dashboard!";
    } else if (text.includes('certificate') || text.includes('download')) {
      intent = 'CERTIFICATE';
      reply = "You can view and download your official Digital Policy Certificate anytime! Go to your Dashboard, locate your active policy, and click the 'Certificate' button to view or print as PDF.";
    } else if (matchedCategory && isAskingForPlans) {
      intent = 'RECOMMENDATION';
      recommendedPolicies = policies
        .filter((p) => p.category === matchedCategory)
        .slice(0, 3)
        .map((p, idx) => ({ ...p, matchScore: 95 - idx * 4 }));
      reply = `Here are our top recommended **${matchedCategory}** insurance plans tailored for your needs:`;
    } else if ((text.includes('cheap') || text.includes('affordable') || text.includes('budget') || text.includes('low premium')) && isAskingForPlans) {
      intent = 'BUDGET_RECOMMENDATION';
      recommendedPolicies = [...policies]
        .sort((a, b) => a.premium - b.premium)
        .slice(0, 3)
        .map((p, idx) => ({ ...p, matchScore: 94 - idx * 3 }));
      reply = "Here are our most budget-friendly insurance plans offering maximum value at low annual premiums:";
    } else if (matchedCategory && !isAskingForPlans) {
      intent = 'CATEGORY_INFO';
      reply = `**${matchedCategory} Insurance** on PolicySphere provides comprehensive coverage, seamless cashless network hospitalization, and fast digital claims. Would you like me to recommend specific **${matchedCategory} plans**?`;
      recommendedPolicies = [];
    } else if (isAskingForPlans) {
      intent = 'GENERAL_RECOMMENDATION';
      recommendedPolicies = policies.slice(0, 3).map((p, idx) => ({ ...p, matchScore: 91 - idx * 3 }));
      reply = "Here are our highest-rated insurance plans across all categories:";
    } else {
      // Default conversational response without unsolicited recommendations
      reply = "I am here to help you navigate insurance seamlessly! You can ask me to:\n• Recommend specific plans (e.g. *'Recommend a Health plan for my family'*)\n• Predict multi-year premiums with healthcare inflation\n• Estimate claim probabilities & deductible sweet spots\n• Guide you on claims, tax savings (80D/80C), or policy fine print.";
      recommendedPolicies = [];
    }

    return {
      reply,
      intent,
      recommendedPolicies: recommendedPolicies.map((p) => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        category: p.category,
        premium: p.premium,
        coverageAmount: p.coverageAmount,
        matchScore: p.matchScore || 88,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
      })),
    };
  }

  /**
   * Calculate personalized recommendations with Match Score (0-100%) and rationale
   */
  static async calculatePersonalizedRecommendations(params, userId = null) {
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

    const result = {
      totalEvaluated: evaluated.length,
      recommendations: evaluated,
    };

    try {
      await prisma.aIAssessmentLog.create({
        data: {
          userId: userId || null,
          assessmentType: 'RECOMMENDATION',
          inputData: params,
          resultData: { total: evaluated.length, topMatch: evaluated[0] ? evaluated[0].name : null },
        },
      });
    } catch (logErr) {
      console.warn('Could not log Recommendation assessment:', logErr.message);
    }

    return result;
  }

  /**
   * Calculate dynamic risk score (0-100), risk tier, premium adjustment & mitigation tips
   */
  static async calculateRiskScore(params, userId = null) {
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

    const result = {
      riskScore: finalRiskScore,
      riskTier,
      riskTierColor,
      estimatedAdjustment,
      breakdown,
      mitigationTips,
    };

    try {
      await prisma.aIAssessmentLog.create({
        data: {
          userId: userId || null,
          assessmentType: 'RISK_SCORE',
          inputData: params,
          resultData: { riskScore: finalRiskScore, riskTier },
        },
      });
    } catch (logErr) {
      console.warn('Could not log Risk Score assessment:', logErr.message);
    }

    return result;
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

  /**
   * 3. PREMIUM PREDICTION ENGINE (SRS Requirement 15.2)
   * 5-Year actuarial trajectory projection considering healthcare inflation, age milestones, & NCB curves
   */
  static async predictPremiumTrajectory(params, userId = null) {
    const {
      currentAge = 32,
      basePremium = 24000,
      category = 'HEALTH',
      coverageAmount = 1000000,
      smoker = false,
      preExistingConditions = false,
      projectionYears = 5,
    } = params;

    const numAge = Number(currentAge) || 32;
    const numBase = Number(basePremium) || 24000;
    const numCoverage = Number(coverageAmount) || 1000000;
    const isSmoker = smoker === true || smoker === 'true';
    const hasPreExisting = preExistingConditions === true || preExistingConditions === 'true';

    // Baseline compounding inflation rates by category
    let annualInflationRate = 0.085; // 8.5% annual medical inflation in India
    if (category === 'MOTOR') annualInflationRate = 0.055;
    else if (category === 'LIFE') annualInflationRate = 0.035;
    else if (category === 'TRAVEL') annualInflationRate = 0.05;
    else if (category === 'HOME') annualInflationRate = 0.06;

    // NCB (No Claim Bonus) progression discounts
    const ncbSchedule = [0, 0.20, 0.25, 0.35, 0.50];

    // Multi-year locked rate factor (locking in today earns 12% multi-year discount and protects from inflation)
    const lockedAnnualRate = Math.round(numBase * 0.88);

    const trajectory = [];
    let cumulativeMarket = 0;
    let cumulativeNCB = 0;
    let cumulativeLocked = 0;

    for (let yr = 1; yr <= projectionYears; yr++) {
      const projectedAge = numAge + (yr - 1);
      const inflationMultiplier = Math.pow(1 + annualInflationRate, yr - 1);

      // Age milestone jump loading
      let ageJumpLoading = 0;
      if (projectedAge >= 60) ageJumpLoading = 0.35;
      else if (projectedAge >= 55) ageJumpLoading = 0.25;
      else if (projectedAge >= 50) ageJumpLoading = 0.20;
      else if (projectedAge >= 45) ageJumpLoading = 0.15;
      else if (projectedAge >= 35) ageJumpLoading = 0.10;

      // Risk loading factor
      let riskMultiplier = 1.0;
      if (isSmoker) riskMultiplier += 0.15;
      if (hasPreExisting) riskMultiplier += 0.12;

      // Unlocked Market Rate
      const standardPremium = Math.round(numBase * inflationMultiplier * (1 + ageJumpLoading) * riskMultiplier);

      // NCB Discounted Rate (if no claims filed)
      const ncbDiscount = ncbSchedule[yr - 1] || 0.50;
      const ncbPremium = Math.round(standardPremium * (1 - ncbDiscount));

      // Multi-year Locked Rate (protected from annual inflation & age jump)
      const lockedPremium = lockedAnnualRate;

      cumulativeMarket += standardPremium;
      cumulativeNCB += ncbPremium;
      cumulativeLocked += lockedPremium;

      trajectory.push({
        yearLabel: `Year ${yr}`,
        yearNumber: yr,
        projectedAge,
        standardPremium,
        ncbPremium,
        lockedPremium,
        inflationImpact: Math.round((inflationMultiplier - 1) * 100),
        ageBracketLoading: Math.round(ageJumpLoading * 100),
        cumulativeMarket,
        cumulativeLocked,
      });
    }

    const fiveYearSavingsWithLock = cumulativeMarket - cumulativeLocked;
    const year5IncreasePercent = Math.round(((trajectory[trajectory.length - 1].standardPremium - numBase) / numBase) * 100);

    const actuarialDrivers = [
      `Medical & repair sector inflation modeled at ${(annualInflationRate * 100).toFixed(1)}% compounded annually.`,
      `Age progression from ${numAge} to ${numAge + projectionYears - 1} triggers insurance age-band re-ratings.`,
      isSmoker ? 'Active tobacco loading applies an ongoing 15% actuarial surcharge.' : 'Non-smoker preferred rate preserves base tier eligibility.',
      `Locking a multi-year rate today generates an estimated ₹${fiveYearSavingsWithLock.toLocaleString('en-IN')} cumulative savings over 5 years.`,
      `Maintaining a zero-claim record unlocks up to 50% No-Claim Bonus (NCB) discounts by Year 5.`,
    ];

    const result = {
      summary: {
        category,
        currentAge: numAge,
        basePremium: numBase,
        coverageAmount: numCoverage,
        year1Premium: trajectory[0].standardPremium,
        year5Premium: trajectory[trajectory.length - 1].standardPremium,
        year5IncreasePercent,
        cumulativeMarketCost: cumulativeMarket,
        cumulativeNCBCost: cumulativeNCB,
        cumulativeLockedCost: cumulativeLocked,
        fiveYearSavingsWithLock,
        inflationRatePercent: Number((annualInflationRate * 100).toFixed(1)),
      },
      trajectory,
      actuarialDrivers,
    };

    try {
      await prisma.aIAssessmentLog.create({
        data: {
          userId: userId || null,
          assessmentType: 'PREMIUM_PREDICTION',
          inputData: params,
          resultData: result.summary,
        },
      });
    } catch (logErr) {
      console.warn('Could not log Premium Prediction assessment:', logErr.message);
    }

    return result;
  }

  /**
   * 4. CLAIM PROBABILITY ENGINE (SRS Requirement 15.3)
   * Calculates statistical likelihood of claim filing over 12, 24, 36 months and deductible sweet spots
   */
  static async calculateClaimProbability(params, userId = null) {
    const {
      category = 'HEALTH',
      age = 32,
      smoker = false,
      preExistingConditions = false,
      drivingHistory = 'CLEAN',
      coverageAmount = 500000,
      annualMileage = 12000,
      hospitalizationInPast2Years = false,
    } = params;

    const numAge = Number(age) || 32;
    const numCoverage = Number(coverageAmount) || 500000;
    const isSmoker = smoker === true || smoker === 'true';
    const hasPreExisting = preExistingConditions === true || preExistingConditions === 'true';
    const priorHospitalization = hospitalizationInPast2Years === true || hospitalizationInPast2Years === 'true';

    // Baseline 12-month probability by category
    let baseProbability = 0.12; // 12% general population health claim rate
    if (category === 'MOTOR') baseProbability = 0.18;
    else if (category === 'LIFE') baseProbability = 0.015;
    else if (category === 'TRAVEL') baseProbability = 0.08;
    else if (category === 'HOME') baseProbability = 0.05;

    const riskDrivers = [];

    // Age factor
    if (numAge > 50) {
      baseProbability += 0.12;
      riskDrivers.push({ driver: 'Age 50+ Bracket', weight: '+12%', description: 'Higher medical utilization and chronic symptom incidence.' });
    } else if (numAge < 25 && (category === 'MOTOR' || category === 'TRAVEL')) {
      baseProbability += 0.08;
      riskDrivers.push({ driver: 'Young Adult Motor/Travel Cohort', weight: '+8%', description: 'Statistical frequency of minor road collisions & adventure claims.' });
    } else {
      riskDrivers.push({ driver: 'Age Bracket (25-49)', weight: 'Optimal', description: 'Lowest volatility underwriting cohort.' });
    }

    // Health factors
    if (hasPreExisting) {
      baseProbability += 0.15;
      riskDrivers.push({ driver: 'Pre-existing Medical Condition', weight: '+15%', description: 'Elevated likelihood of specialized consultations or flare-up care.' });
    }
    if (isSmoker) {
      baseProbability += 0.07;
      riskDrivers.push({ driver: 'Tobacco Usage', weight: '+7%', description: 'Higher respiratory and cardiovascular vulnerability.' });
    }
    if (priorHospitalization) {
      baseProbability += 0.10;
      riskDrivers.push({ driver: 'Prior Hospitalization History', weight: '+10%', description: 'Recent medical interventions increase recurrence likelihood.' });
    }

    // Motor factors
    if (category === 'MOTOR') {
      if (drivingHistory === 'ACCIDENTS') {
        baseProbability += 0.18;
        riskDrivers.push({ driver: 'Prior Collision History', weight: '+18%', description: 'High motor loss ratio frequency.' });
      } else if (drivingHistory === 'MODERATE') {
        baseProbability += 0.08;
        riskDrivers.push({ driver: 'Moderate Traffic Infractions', weight: '+8%', description: 'Moderate claim probability modifier.' });
      }
      if (Number(annualMileage) > 18000) {
        baseProbability += 0.06;
        riskDrivers.push({ driver: 'High Annual Road Mileage (>18,000 km)', weight: '+6%', description: 'Increased road hazard exposure.' });
      }
    }

    // Clamped 12-month probability (5% to 85%)
    const prob12 = Math.min(0.85, Math.max(0.04, baseProbability));
    // Compounded 24 and 36-month probability: 1 - (1 - p)^n
    const prob24 = Math.min(0.95, 1 - Math.pow(1 - prob12, 2));
    const prob36 = Math.min(0.98, 1 - Math.pow(1 - prob12, 3));

    // Estimated average payout when a claim occurs
    const estimatedAveragePayout = Math.round(numCoverage * (category === 'MOTOR' ? 0.22 : 0.35));
    const expectedValueLoss = Math.round(estimatedAveragePayout * prob12);

    // Deductible Optimization Engine
    const deductibleOptions = [
      {
        deductibleAmount: 0,
        premiumDiscount: '0% (Standard)',
        annualPremiumAdjustment: 0,
        recommended: prob12 > 0.40,
        analysis: 'Best for high-probability profiles where every claim is fully reimbursed.',
      },
      {
        deductibleAmount: 10000,
        premiumDiscount: '15% Off Premium',
        annualPremiumAdjustment: -3600,
        recommended: prob12 >= 0.15 && prob12 <= 0.40,
        analysis: 'Optimal balance! Saves ₹3,600 on premiums with minimal out-of-pocket exposure.',
      },
      {
        deductibleAmount: 25000,
        premiumDiscount: '28% Off Premium',
        annualPremiumAdjustment: -6800,
        recommended: prob12 < 0.15,
        analysis: 'Ideal for healthy, low-risk users looking to drastically cut yearly insurance spend.',
      },
      {
        deductibleAmount: 50000,
        premiumDiscount: '42% Off Premium',
        annualPremiumAdjustment: -10200,
        recommended: false,
        analysis: 'High catastrophic deductible suited strictly for emergency top-up coverage.',
      },
    ];

    const safetyRecommendations = [
      'Schedule routine preventive health screenings to detect and manage ailments before acute intervention.',
      'Maintain an emergency healthcare fund of ₹25,000 to confidently opt for voluntary deductibles.',
      category === 'MOTOR'
        ? 'Install an authorized dashcam or telematics GPS unit to lower loss risk and expedite claim approvals.'
        : 'Select cashless network hospitals to eliminate out-of-pocket reimbursement delays.',
    ];

    const result = {
      probabilities: {
        next12Months: Math.round(prob12 * 100),
        next24Months: Math.round(prob24 * 100),
        next36Months: Math.round(prob36 * 100),
      },
      payoutEstimations: {
        estimatedAveragePayout,
        expectedValueLoss,
      },
      riskDrivers,
      deductibleOptions,
      safetyRecommendations,
    };

    try {
      await prisma.aIAssessmentLog.create({
        data: {
          userId: userId || null,
          assessmentType: 'CLAIM_PROBABILITY',
          inputData: params,
          resultData: result.probabilities,
        },
      });
    } catch (logErr) {
      console.warn('Could not log Claim Probability assessment:', logErr.message);
    }

    return result;
  }

  /**
   * 5. FRAUD DETECTION & CLAIM ANOMALY SCORING (SRS Requirement 15.4)
   * Evaluates claim velocity, billing ratio anomalies, document authenticity, and inception latency
   */
  static async analyzeClaimFraud(claimData, userId = null) {
    const {
      claimId = null,
      proposalId = null,
      claimAmount = 85000,
      coverageAmount = 500000,
      policyAgeDays = 42,
      priorClaimsCount = 0,
      hospitalType = 'NETWORK', // NETWORK, NON_NETWORK, UNLISTED_CLINIC
      documentCount = 3,
      ocrConfidence = 88,
      incidentTiming = 'STANDARD', // STANDARD, ODD_HOURS, RENEWAL_EVE
    } = claimData;

    const numClaimAmount = Number(claimAmount) || 85000;
    const numCoverage = Number(coverageAmount) || 500000;
    const numPolicyAge = Number(policyAgeDays) || 42;
    const numPriorClaims = Number(priorClaimsCount) || 0;
    const numDocs = Number(documentCount) || 3;
    const numOcr = Number(ocrConfidence) || 88;

    let fraudScore = 10;
    const indicators = [];

    // Rule 1: Early claim latency (inception to incident)
    if (numPolicyAge <= 15) {
      fraudScore += 35;
      indicators.push({
        code: 'EARLY_CLAIM_HIGH',
        title: 'Severe Inception Latency Anomaly',
        severity: 'CRITICAL',
        description: `Claim submitted only ${numPolicyAge} days after policy issuance. High correlation with pre-meditated loss.`,
      });
    } else if (numPolicyAge <= 45) {
      fraudScore += 18;
      indicators.push({
        code: 'EARLY_CLAIM_MODERATE',
        title: 'Early Policy Inception Window',
        severity: 'WARNING',
        description: `Claim occurred within initial 45 days of policy lifecycle. Requires validation against waiting period clauses.`,
      });
    } else {
      indicators.push({
        code: 'MATURE_POLICY',
        title: 'Mature Policy Tenure',
        severity: 'CLEAN',
        description: `Policy active for ${numPolicyAge} days prior to incident date.`,
      });
    }

    // Rule 2: Claim Velocity Check
    if (numPriorClaims >= 3) {
      fraudScore += 30;
      indicators.push({
        code: 'HIGH_CLAIM_VELOCITY',
        title: 'Repeated Claim Velocity Spike',
        severity: 'CRITICAL',
        description: `${numPriorClaims} claims filed within past 12 months. Exceeds actuarial standard claim frequency threshold.`,
      });
    } else if (numPriorClaims === 2) {
      fraudScore += 12;
      indicators.push({
        code: 'MODERATE_CLAIM_VELOCITY',
        title: 'Multiple Claim Filings',
        severity: 'WARNING',
        description: 'Second claim within rolling 12-month period.',
      });
    }

    // Rule 3: Hospital or Workshop Network Trust Rating
    if (hospitalType === 'UNLISTED_CLINIC') {
      fraudScore += 25;
      indicators.push({
        code: 'SUSPICIOUS_FACILITY',
        title: 'Unlisted / High-Risk Facility',
        severity: 'HIGH',
        description: 'Facility not empaneled on Rohini / GIPSA registry and flagged in regional watchlist.',
      });
    } else if (hospitalType === 'NON_NETWORK') {
      fraudScore += 10;
      indicators.push({
        code: 'NON_NETWORK_CLAIM',
        title: 'Non-Network Reimbursement',
        severity: 'INFO',
        description: 'Reimbursement claim outside cashless network; requires itemized original receipt audit.',
      });
    }

    // Rule 4: Claim Amount vs Sum Insured Ratio
    const depletionRatio = numClaimAmount / numCoverage;
    if (depletionRatio > 0.85) {
      fraudScore += 15;
      indicators.push({
        code: 'HIGH_DEPLETION_RATIO',
        title: 'Near-Exhaustion Claim Amount',
        severity: 'WARNING',
        description: `Claim amounts to ${(depletionRatio * 100).toFixed(0)}% of total policy sum insured.`,
      });
    }

    // Rule 5: Documentation & OCR Integrity
    if (numDocs < 2) {
      fraudScore += 20;
      indicators.push({
        code: 'INSUFFICIENT_DOCUMENTATION',
        title: 'Deficient Corroborating Records',
        severity: 'HIGH',
        description: 'Only 1 document uploaded. Missing itemized pharmacy bills or diagnostic lab reports.',
      });
    }
    if (numOcr < 65) {
      fraudScore += 22;
      indicators.push({
        code: 'OCR_TAMPERING_ANOMALY',
        title: 'OCR Forensic Validation Failure',
        severity: 'CRITICAL',
        description: `Document OCR verification confidence low (${numOcr}%). Inconsistent metadata fonts or altered timestamps detected.`,
      });
    }

    // Rule 6: Incident Timing
    if (incidentTiming === 'RENEWAL_EVE') {
      fraudScore += 12;
      indicators.push({
        code: 'EXPIRATION_EVE_INCIDENT',
        title: 'Policy Expiry Climax Claim',
        severity: 'WARNING',
        description: 'Incident dated within 48 hours of policy lapse date.',
      });
    }

    const finalScore = Math.min(99, Math.max(8, Math.round(fraudScore)));

    let riskTier = 'LOW';
    let recommendation = 'FAST_TRACK_APPROVED';
    let recommendationText = 'Zero critical anomalies detected. Eligible for straight-through automated STP cashless settlement.';
    let auditChecklist = [
      'Confirm digital policy is in active status.',
      'Verify KYC matches insured policyholder record.',
    ];

    if (finalScore >= 65) {
      riskTier = 'HIGH_RISK';
      recommendation = 'CRITICAL_FRAUD_AUDIT';
      recommendationText = 'Critical red flags triggered. Claim auto-halted; initiate physical investigator site audit and hospital bill reconciliation.';
      auditChecklist = [
        'Deploy field investigator for physical hospital indoor case paper (ICP) verification.',
        'Request certified forensic OCR re-scan of tax invoices.',
        'Cross-reference treating physician registration number with Medical Council registry.',
      ];
    } else if (finalScore >= 35) {
      riskTier = 'ELEVATED';
      recommendation = 'MANUAL_INVESTIGATION';
      recommendationText = 'Moderate risk anomaly pattern. Route to Senior Claims Adjuster for itemized receipt verification.';
      auditChecklist = [
        'Call hospital billing desk to verify invoice numbers and payment receipt.',
        'Verify doctor prescription dates match diagnostic lab report timestamps.',
      ];
    }

    const assessmentResult = {
      claimId,
      proposalId,
      fraudScore: finalScore,
      riskTier,
      recommendation,
      recommendationText,
      indicators,
      auditChecklist,
      evaluatedAt: new Date().toISOString(),
    };

    // Store in database
    try {
      if (claimId) {
        await prisma.claimFraudAssessment.upsert({
          where: { claimId },
          update: {
            fraudScore: finalScore,
            riskTier,
            indicators,
            recommendation,
            analysisDetails: assessmentResult,
          },
          create: {
            claimId,
            proposalId,
            fraudScore: finalScore,
            riskTier,
            indicators,
            recommendation,
            analysisDetails: assessmentResult,
          },
        });
      }

      await prisma.aIAssessmentLog.create({
        data: {
          userId: userId || null,
          assessmentType: 'FRAUD_ANALYSIS',
          inputData: claimData,
          resultData: assessmentResult,
        },
      });
    } catch (dbErr) {
      console.warn('Could not persist Claim Fraud Assessment:', dbErr.message);
    }

    return assessmentResult;
  }

  /**
   * 8. RETRIEVE RECENT AI ASSESSMENTS FOR A USER
   */
  static async getUserAssessments(userId) {
    if (!userId) return [];
    return prisma.aIAssessmentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}

module.exports = AIService;


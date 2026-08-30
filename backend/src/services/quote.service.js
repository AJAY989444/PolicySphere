const prisma = require('../config/db');

/**
 * Available Add-on Riders with fixed annual prices
 */
const ADD_ON_RIDERS = {
  criticalIllness: { id: 'criticalIllness', name: 'Critical Illness Cover', price: 1500 },
  zeroDep: { id: 'zeroDep', name: 'Zero Depreciation Cover', price: 2000 },
  personalAccident: { id: 'personalAccident', name: 'Personal Accident Cover', price: 1000 },
  roadsideAssistance: { id: 'roadsideAssistance', name: '24x7 Roadside Assistance', price: 500 },
  hospitalDailyCash: { id: 'hospitalDailyCash', name: 'Hospital Daily Cash Allowance', price: 800 },
  engineProtector: { id: 'engineProtector', name: 'Engine & Gearbox Protection', price: 1200 },
};

class QuoteService {
  /**
   * Calculates dynamic insurance quote premium based on user input parameters and optional policy.
   * @param {Object} params - Input factors (policyId, age, cityTier, sumAssured, ncbPercent, deductible, selectedAddons, category)
   */
  static async calculateQuote(params = {}) {
    const {
      policyId = null,
      age = 30,
      gender = 'MALE',
      cityTier = 'TIER_1',
      sumAssured = 500000,
      ncbPercent = 0,
      deductible = 0,
      selectedAddons = [],
      category = 'HEALTH',
    } = params;

    let basePremium = 5000;
    let baseCoverage = 500000;
    let policyDetails = null;

    if (policyId) {
      policyDetails = await prisma.insurancePolicy.findUnique({
        where: { id: policyId },
      });
      if (policyDetails) {
        basePremium = policyDetails.premium;
        baseCoverage = policyDetails.coverageAmount || 500000;
      }
    } else {
      // Default base calculation by category if no specific policyId provided
      if (category === 'HEALTH') basePremium = 8000;
      else if (category === 'MOTOR') basePremium = 6000;
      else if (category === 'LIFE') basePremium = 12000;
      else if (category === 'TRAVEL') basePremium = 2500;
      else if (category === 'HOME') basePremium = 3500;
    }

    // 1. Age Multiplier
    // 18-30: 1.0x, 31-45: 1.2x, 46-60: 1.5x, 60+: 1.8x
    let ageMultiplier = 1.0;
    const numericAge = Number(age);
    if (numericAge <= 30) ageMultiplier = 1.0;
    else if (numericAge <= 45) ageMultiplier = 1.2;
    else if (numericAge <= 60) ageMultiplier = 1.5;
    else ageMultiplier = 1.8;

    // 2. City Tier Risk Factor
    // Tier 1: 1.1x, Tier 2: 1.0x, Tier 3: 0.95x
    let cityRiskFactor = 1.0;
    if (cityTier === 'TIER_1' || cityTier === 'metro' || cityTier === '1') cityRiskFactor = 1.1;
    else if (cityTier === 'TIER_2' || cityTier === '2') cityRiskFactor = 1.0;
    else if (cityTier === 'TIER_3' || cityTier === '3') cityRiskFactor = 0.95;

    // 3. Sum Assured Scaling Factor
    const chosenSumAssured = Number(sumAssured) || baseCoverage;
    const sumAssuredRatio = baseCoverage > 0 ? chosenSumAssured / baseCoverage : 1.0;
    // Scale smoothly so doubling sum assured doesn't strictly double premium linearly (0.6 power curve or scaled ratio)
    const sumAssuredFactor = Math.pow(sumAssuredRatio, 0.75);

    // Initial Risk Premium before discounts & add-ons
    const riskAdjustedBasePremium = basePremium * ageMultiplier * cityRiskFactor * sumAssuredFactor;

    // 4. Voluntary Deductible Discount
    let deductibleDiscountPercent = 0;
    const numericDeductible = Number(deductible);
    if (numericDeductible >= 50000) deductibleDiscountPercent = 0.15;
    else if (numericDeductible >= 25000) deductibleDiscountPercent = 0.10;
    else if (numericDeductible >= 10000) deductibleDiscountPercent = 0.05;

    const deductibleDiscountAmount = riskAdjustedBasePremium * deductibleDiscountPercent;

    // 5. No-Claim Bonus (NCB) Discount (5% to 50%)
    const validatedNcbPercent = Math.min(Math.max(Number(ncbPercent) || 0, 0), 50);
    const ncbDiscountAmount = (riskAdjustedBasePremium - deductibleDiscountAmount) * (validatedNcbPercent / 100);

    // Premium after discounts
    const netBasePremium = Math.max(
      riskAdjustedBasePremium - deductibleDiscountAmount - ncbDiscountAmount,
      basePremium * 0.4
    );

    // 6. Selected Add-ons Total
    let addonsTotal = 0;
    const activeAddons = [];
    if (Array.isArray(selectedAddons)) {
      selectedAddons.forEach((addonId) => {
        if (ADD_ON_RIDERS[addonId]) {
          addonsTotal += ADD_ON_RIDERS[addonId].price;
          activeAddons.push(ADD_ON_RIDERS[addonId]);
        }
      });
    }

    // 7. Taxable Subtotal & 18% GST Calculation
    const taxableSubtotal = netBasePremium + addonsTotal;
    const gstAmount = taxableSubtotal * 0.18;
    const finalAnnualPremium = Math.round(taxableSubtotal + gstAmount);
    const finalMonthlyPremium = Math.round(finalAnnualPremium / 12);

    // Total Savings calculation
    const totalSavings = Math.round(deductibleDiscountAmount + ncbDiscountAmount);

    return {
      policyId,
      policyDetails,
      inputs: {
        age: numericAge,
        gender,
        cityTier,
        sumAssured: chosenSumAssured,
        ncbPercent: validatedNcbPercent,
        deductible: numericDeductible,
        selectedAddons,
        category,
      },
      calculation: {
        basePolicyPremium: Math.round(basePremium),
        riskAdjustedBasePremium: Math.round(riskAdjustedBasePremium),
        ageMultiplier,
        cityRiskFactor,
        sumAssuredFactor: Number(sumAssuredFactor.toFixed(2)),
        deductibleDiscountAmount: Math.round(deductibleDiscountAmount),
        ncbDiscountPercent: validatedNcbPercent,
        ncbDiscountAmount: Math.round(ncbDiscountAmount),
        netBasePremium: Math.round(netBasePremium),
        addonsTotal: Math.round(addonsTotal),
        activeAddons,
        taxableSubtotal: Math.round(taxableSubtotal),
        gstRate: '18%',
        gstAmount: Math.round(gstAmount),
        finalAnnualPremium,
        finalMonthlyPremium,
        totalSavings,
      },
      availableAddons: Object.values(ADD_ON_RIDERS),
    };
  }
}

module.exports = QuoteService;

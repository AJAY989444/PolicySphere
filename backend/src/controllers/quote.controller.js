const prisma = require('../config/db');

/**
 * Custom Quote Engine Controller
 * Calculates estimated insurance premiums based on customer demographic data and risk factors.
 */
class QuoteController {
  static async calculateQuote(req, res, next) {
    try {
      const {
        category = 'HEALTH',
        age = 30,
        coverageAmount = 500000,
        familyMembers = 1,
        smoker = false,
        preExistingConditions = false,
        vehicleAgeYears = 0,
      } = req.body;

      // Base rate calculation multipliers
      let baseRate = 0.015; // 1.5% base of coverage

      if (category === 'HEALTH') {
        baseRate = 0.016;
        if (age > 45) baseRate += 0.008;
        if (age > 60) baseRate += 0.015;
        if (smoker) baseRate += 0.005;
        if (preExistingConditions) baseRate += 0.007;
        if (familyMembers > 1) baseRate += (familyMembers - 1) * 0.004;
      } else if (category === 'LIFE') {
        baseRate = 0.0012; // Life is cheaper ratio relative to sum assured
        if (age > 40) baseRate += 0.001;
        if (age > 50) baseRate += 0.0025;
        if (smoker) baseRate += 0.0015;
      } else if (category === 'MOTOR') {
        baseRate = 0.022;
        if (vehicleAgeYears > 5) baseRate += 0.008;
      } else if (category === 'TRAVEL') {
        baseRate = 0.005;
      } else if (category === 'HOME') {
        baseRate = 0.002;
      }

      const calculatedAnnualPremium = Math.round(coverageAmount * baseRate);
      const calculatedMonthlyPremium = Math.round(calculatedAnnualPremium / 12);

      // Find matching policies from DB within budget range
      const matchingPolicies = await prisma.insurancePolicy.findMany({
        where: {
          category: category,
          isActive: true,
        },
        take: 3,
      });

      return res.json({
        success: true,
        quote: {
          category,
          coverageAmount,
          calculatedAnnualPremium,
          calculatedMonthlyPremium,
          breakdown: {
            basePremium: Math.round(calculatedAnnualPremium * 0.82),
            gstTax: Math.round(calculatedAnnualPremium * 0.18),
            appliedFactors: {
              ageGroup: age > 45 ? 'Senior Risk Tier' : 'Standard Risk Tier',
              familyMembers,
              smoker,
              preExistingConditions,
            },
          },
          recommendedPolicies: matchingPolicies,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuoteController;

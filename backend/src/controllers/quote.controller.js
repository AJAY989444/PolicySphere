const QuoteService = require('../services/quote.service');
const prisma = require('../config/db');

/**
 * Custom Quote Engine Controller
 * Calculates estimated insurance premiums based on customer demographic data and risk factors.
 */
class QuoteController {
  static async calculateQuote(req, res, next) {
    try {
      const {
        policyId = null,
        category = 'HEALTH',
        age = 30,
        gender = 'MALE',
        cityTier = 'TIER_1',
        sumAssured = 500000,
        ncbPercent = 0,
        deductible = 0,
        selectedAddons = [],
        familyMembers = 1,
        smoker = false,
        preExistingConditions = false,
        vehicleAgeYears = 0,
      } = req.body;

      const quoteResult = await QuoteService.calculateQuote({
        policyId,
        category,
        age,
        gender,
        cityTier,
        sumAssured,
        ncbPercent,
        deductible,
        selectedAddons,
        familyMembers,
        smoker,
        preExistingConditions,
        vehicleAgeYears,
      });

      // Find matching policies from DB if no specific policyId was provided
      let matchingPolicies = [];
      if (!policyId) {
        matchingPolicies = await prisma.insurancePolicy.findMany({
          where: {
            category: category,
            isActive: true,
          },
          take: 3,
        });
      }

      return res.json({
        success: true,
        quote: {
          ...quoteResult.calculation,
          category,
          coverageAmount: sumAssured,
          calculatedAnnualPremium: quoteResult.calculation.finalAnnualPremium,
          calculatedMonthlyPremium: quoteResult.calculation.finalMonthlyPremium,
          inputs: quoteResult.inputs,
          breakdown: {
            basePremium: quoteResult.calculation.netBasePremium,
            gstTax: quoteResult.calculation.gstAmount,
            appliedFactors: {
              ageGroup: age > 45 ? 'Senior Risk Tier' : 'Standard Risk Tier',
              familyMembers,
              smoker,
              preExistingConditions,
              ageMultiplier: quoteResult.calculation.ageMultiplier,
              cityRiskFactor: quoteResult.calculation.cityRiskFactor,
            },
          },
          policyDetails: quoteResult.policyDetails,
          recommendedPolicies: matchingPolicies,
          availableAddons: quoteResult.availableAddons,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuoteController;

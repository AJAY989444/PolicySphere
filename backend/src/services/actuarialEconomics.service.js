// backend/src/services/actuarialEconomics.service.js
// Unit Economics, CLV & Actuarial Profitability Engine (SRS Module 38)

const prisma = require('../config/db');

class ActuarialEconomicsService {
  /**
   * Computes portfolio unit economics and underwriting ratios
   */
  static async getPortfolioUnitEconomics() {
    // 1. Core Unit Economics Benchmarks
    const avgAnnualPremium = 18500; // ₹ 18,500 average annual premium
    const retentionRate = 0.84; // 84% annual policy renewal retention
    const underwritingMargin = 0.16; // 16% net underwriting margin
    const discountRate = 0.08; // 8% cost of capital

    // CLV formula: (Annual Premium * Margin% * Retention%) / (1 + DiscountRate - RetentionRate)
    const annualMarginPerUser = avgAnnualPremium * underwritingMargin;
    const clvNumerator = annualMarginPerUser * retentionRate;
    const clvDenominator = 1 + discountRate - retentionRate; // 1 + 0.08 - 0.84 = 0.24
    const customerLifetimeValue = Math.round(clvNumerator / clvDenominator); // approx ₹ 10,360

    // Blended CAC across channels
    const blendedCac = 2450; // ₹ 2,450 blended customer acquisition cost
    const ltvCacRatio = parseFloat((customerLifetimeValue / blendedCac).toFixed(2)); // ~ 4.2x (healthy is > 3.0x)
    const paybackPeriodMonths = parseFloat(((blendedCac / annualMarginPerUser) * 12).toFixed(1)); // ~ 9.9 months

    // 2. Line of Business (LoB) Loss Ratios & Combined Ratios
    const linesOfBusiness = [
      {
        category: 'HEALTH',
        earnedPremiumCr: 42.8,
        incurredClaimsCr: 27.4,
        lossRatioPercent: 64.0,
        expenseRatioPercent: 18.2,
        combinedRatioPercent: 82.2, // Underwriting profit if < 100%
        underwritingStatus: 'HIGHLY_PROFITABLE',
      },
      {
        category: 'MOTOR',
        earnedPremiumCr: 38.5,
        incurredClaimsCr: 28.1,
        lossRatioPercent: 73.0,
        expenseRatioPercent: 19.5,
        combinedRatioPercent: 92.5,
        underwritingStatus: 'PROFITABLE',
      },
      {
        category: 'LIFE',
        earnedPremiumCr: 65.2,
        incurredClaimsCr: 29.3,
        lossRatioPercent: 44.9,
        expenseRatioPercent: 14.1,
        combinedRatioPercent: 59.0,
        underwritingStatus: 'PRIME_SURPLUS',
      },
      {
        category: 'TRAVEL',
        earnedPremiumCr: 8.4,
        incurredClaimsCr: 3.2,
        lossRatioPercent: 38.1,
        expenseRatioPercent: 22.0,
        combinedRatioPercent: 60.1,
        underwritingStatus: 'PRIME_SURPLUS',
      },
    ];

    // 3. Acquisition Channel Efficiencies
    const acquisitionChannels = [
      { channel: 'ORGANIC_SEO', cacInr: 650, ltvCacRatio: 15.9, conversionRate: 4.8 },
      { channel: 'CORPORATE_PORTAL', cacInr: 1200, ltvCacRatio: 8.6, conversionRate: 12.4 },
      { channel: 'PERFORMANCE_ADS', cacInr: 3400, ltvCacRatio: 3.0, conversionRate: 3.2 },
      { channel: 'PARTNER_EMBEDDED', cacInr: 890, ltvCacRatio: 11.6, conversionRate: 8.9 },
    ];

    // 4. Portfolio Summary
    const totalEarnedCr = linesOfBusiness.reduce((acc, curr) => acc + curr.earnedPremiumCr, 0);
    const totalClaimsCr = linesOfBusiness.reduce((acc, curr) => acc + curr.incurredClaimsCr, 0);
    const portfolioLossRatio = parseFloat(((totalClaimsCr / totalEarnedCr) * 100).toFixed(1));
    const portfolioCombinedRatio = 74.8; // Target IRDAI benchmark < 85%

    return {
      success: true,
      unitEconomics: {
        avgAnnualPremiumInr: avgAnnualPremium,
        retentionRatePercent: retentionRate * 100,
        customerLifetimeValueInr: customerLifetimeValue,
        blendedCacInr: blendedCac,
        ltvCacRatio,
        paybackPeriodMonths,
        healthyBenchmarkMet: ltvCacRatio >= 3.0,
      },
      portfolioUnderwriting: {
        totalEarnedPremiumCr: parseFloat(totalEarnedCr.toFixed(1)),
        totalIncurredClaimsCr: parseFloat(totalClaimsCr.toFixed(1)),
        portfolioLossRatioPercent: portfolioLossRatio,
        portfolioCombinedRatioPercent: portfolioCombinedRatio,
        solvencyRatioIrdai: 2.15, // IRDAI statutory minimum is 1.50
      },
      linesOfBusiness,
      acquisitionChannels,
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = ActuarialEconomicsService;

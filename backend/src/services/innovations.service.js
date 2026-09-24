// backend/src/services/innovations.service.js
// Future-Ready Innovations: Telematics, IoT Wearables & Embedded Insurance (SRS Module 32)

class InnovationsService {
  /**
   * 1. Telematics & Pay-How-You-Drive (PHYD) Assessment Engine
   */
  static evaluateTelematicsTrip(trip) {
    const {
      distanceKm = 24.5,
      durationMinutes = 45,
      maxSpeedKmph = 72,
      harshBrakes = 1,
      harshAccelerations = 0,
      nightDrivingMinutes = 0,
    } = trip;

    let deductions = 0;

    // Deduct for speeding (> 80 kmph in city, > 110 on highway)
    if (maxSpeedKmph > 110) deductions += 25;
    else if (maxSpeedKmph > 90) deductions += 15;
    else if (maxSpeedKmph > 80) deductions += 5;

    // Deduct for aggressive maneuvers
    deductions += harshBrakes * 4;
    deductions += harshAccelerations * 3;

    // Deduct for high-risk nighttime driving (11 PM - 4 AM)
    if (nightDrivingMinutes > 30) deductions += 12;
    else if (nightDrivingMinutes > 0) deductions += 5;

    const safetyScore = Math.max(30, Math.min(100, 100 - deductions));

    let riskTier = 'SAFE_DRIVER';
    let discountPercent = 25; // up to 30% discount on motor renewal

    if (safetyScore >= 85) {
      riskTier = 'EXCELLENT_DRIVER';
      discountPercent = 30;
    } else if (safetyScore >= 75) {
      riskTier = 'SAFE_DRIVER';
      discountPercent = 20;
    } else if (safetyScore >= 60) {
      riskTier = 'MODERATE_RISK';
      discountPercent = 10;
    } else {
      riskTier = 'HIGH_RISK_DRIVER';
      discountPercent = 0;
    }

    // Dynamic Pay-As-You-Drive (PAYD) per-km micro-rate
    const basePerKmRate = 1.25; // ₹ 1.25 per km base
    const riskMultiplier = safetyScore >= 80 ? 0.8 : safetyScore >= 60 ? 1.0 : 1.35;
    const dynamicCostForTrip = parseFloat((distanceKm * basePerKmRate * riskMultiplier).toFixed(2));

    return {
      tripId: 'TRIP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      distanceKm,
      durationMinutes,
      safetyScore,
      riskTier,
      suggestedRenewalDiscountPercent: discountPercent,
      estimatedTripPremiumCost: dynamicCostForTrip,
      telematicsSignals: {
        maxSpeedKmph,
        harshBrakes,
        harshAccelerations,
        nightDrivingMinutes,
      },
      drivingFeedback:
        safetyScore >= 80
          ? 'Smooth braking and steady cruising. You qualify for maximum 30% renewal discount.'
          : 'High acceleration or harsh braking observed. Smoother braking will boost your premium discount.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 2. IoT Wearable Health Sync & Vitality Wellness Rewards
   */
  static ingestWearableData(metrics) {
    const {
      dailySteps = 9450,
      restingHeartRateBpm = 64,
      activeWorkoutMinutes = 42,
      sleepQualityScore = 85, // 0 - 100
      source = 'APPLE_HEALTH', // APPLE_HEALTH, GOOGLE_FIT, FITBIT, GARMIN
    } = metrics;

    let vitalityScore = 50;

    // Steps evaluation (10,000 steps = optimal)
    if (dailySteps >= 10000) vitalityScore += 20;
    else if (dailySteps >= 7500) vitalityScore += 15;
    else if (dailySteps >= 5000) vitalityScore += 8;

    // Resting heart rate (55-70 bpm is athletic/healthy)
    if (restingHeartRateBpm >= 55 && restingHeartRateBpm <= 70) vitalityScore += 15;
    else if (restingHeartRateBpm <= 80) vitalityScore += 8;

    // Active workout minutes
    if (activeWorkoutMinutes >= 45) vitalityScore += 10;
    else if (activeWorkoutMinutes >= 30) vitalityScore += 7;

    // Sleep quality
    vitalityScore += Math.round(sleepQualityScore * 0.15);

    vitalityScore = Math.min(100, Math.max(20, vitalityScore));

    let tier = 'BRONZE';
    let renewalWellnessCashback = 500;

    if (vitalityScore >= 85) {
      tier = 'PLATINUM';
      renewalWellnessCashback = 3000;
    } else if (vitalityScore >= 75) {
      tier = 'GOLD';
      renewalWellnessCashback = 2000;
    } else if (vitalityScore >= 60) {
      tier = 'SILVER';
      renewalWellnessCashback = 1000;
    }

    return {
      syncId: 'WEARABLE-SYNC-' + Date.now(),
      source,
      vitalityScore,
      wellnessTier: tier,
      dailySteps,
      restingHeartRateBpm,
      activeWorkoutMinutes,
      sleepQualityScore,
      earnedWellnessCashbackInr: renewalWellnessCashback,
      freeHealthCheckupUnlocked: vitalityScore >= 75,
      wellnessBadge: `${tier} ATHLETE`,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. Embedded Insurance Micro-SDK Simulation
   */
  static createEmbeddedQuote(context) {
    const {
      channel = 'E_COMMERCE_CHECKOUT', // E_COMMERCE_CHECKOUT, FLIGHT_BOOKING, RIDE_HAILING
      productValue = 45000,
      customerCity = 'Bengaluru',
    } = context;

    let coverName = 'Extended Device Protection & Screen Shield';
    let baseRate = 0.035; // 3.5%
    let sumInsured = productValue;

    if (channel === 'FLIGHT_BOOKING') {
      coverName = 'Zero-Deductible Flight Delay & Medical Evacuation';
      baseRate = 0.012;
      sumInsured = 500000;
    } else if (channel === 'RIDE_HAILING') {
      coverName = 'Instant Commuter Accident & Hospital Cash Cover';
      baseRate = 0.005;
      sumInsured = 200000;
    }

    const premiumAmount = Math.max(19, Math.round(productValue * baseRate));
    const gst18Percent = Math.round(premiumAmount * 0.18);
    const totalPayable = premiumAmount + gst18Percent;

    return {
      quoteToken: 'EMB_QUOTE_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      channel,
      coverName,
      sumInsured,
      premiumExcludingTax: premiumAmount,
      gst18Percent,
      totalPayable,
      currency: 'INR',
      embeddedTurnaroundSeconds: 0.25,
      masterPolicyUnderwriter: 'ICICI Lombard / HDFC ERGO Embedded syndicate',
      validitySeconds: 900,
    };
  }

  static bindEmbeddedPolicy(quoteToken, customerDetails) {
    return {
      success: true,
      policyCertificateNumber: 'EMB-POL-' + Date.now(),
      quoteToken,
      customerName: customerDetails.name || 'Gaurav Sen',
      customerEmail: customerDetails.email || 'gaurav.sen@example.com',
      status: 'ACTIVE_BOUND',
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: `https://api.policysphere.com/api/documents/embedded/${quoteToken}/certificate.pdf`,
      boundAt: new Date().toISOString(),
    };
  }
}

module.exports = InnovationsService;

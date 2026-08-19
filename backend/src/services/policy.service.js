const prisma = require('../config/db');

class PolicyService {
  /**
   * Get all active insurance policies, with optional filters.
   */
  static async getAllPolicies({ category, search, sortBy, order }) {
    const where = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    if (sortBy === 'premium') {
      orderBy.premium = order === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'coverage') {
      orderBy.coverageAmount = order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return prisma.insurancePolicy.findMany({
      where,
      orderBy,
    });
  }

  /**
   * Get a single policy by ID.
   */
  static async getPolicyById(id) {
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      const error = new Error('Policy not found');
      error.status = 404;
      throw error;
    }

    return policy;
  }

  /**
   * Purchase a policy for a user.
   */
  static async purchasePolicy(userId, policyId) {
    // Verify policy exists and is active
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy || !policy.isActive) {
      const error = new Error('Policy not found or no longer available');
      error.status = 404;
      throw error;
    }

    // Check if user already has an active subscription to this policy
    const existing = await prisma.userPolicy.findFirst({
      where: {
        userId,
        policyId,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      const error = new Error('You already have an active subscription to this policy');
      error.status = 409;
      throw error;
    }

    // Calculate end date based on policy duration (in months)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + policy.duration);

    return prisma.userPolicy.create({
      data: {
        userId,
        policyId,
        premiumPaid: policy.premium,
        startDate,
        endDate,
      },
      include: {
        policy: true,
      },
    });
  }

  /**
   * Get all policies purchased by a user.
   */
  static async getUserPolicies(userId) {
    return prisma.userPolicy.findMany({
      where: { userId },
      include: {
        policy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get dashboard stats for a user.
   */
  static async getUserDashboardStats(userId) {
    const policies = await prisma.userPolicy.findMany({
      where: { userId },
      include: { policy: true },
    });

    const activePolicies = policies.filter(p => p.status === 'ACTIVE');
    const totalPremiums = policies.reduce((sum, p) => sum + p.premiumPaid, 0);
    const totalCoverage = activePolicies.reduce((sum, p) => sum + p.policy.coverageAmount, 0);

    return {
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      totalPremiums,
      totalCoverage,
    };
  }
}

module.exports = PolicyService;

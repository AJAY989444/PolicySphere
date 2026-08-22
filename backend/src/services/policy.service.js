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

  /**
   * Get all policies (including inactive) for admin management.
   */
  static async getAllPoliciesForAdmin() {
    return prisma.insurancePolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new policy.
   */
  static async createPolicy(data) {
    return prisma.insurancePolicy.create({
      data: {
        name: data.name,
        provider: data.provider,
        category: data.category,
        description: data.description,
        coverageAmount: parseFloat(data.coverageAmount),
        premium: parseFloat(data.premium),
        duration: parseInt(data.duration, 10),
        features: data.features || [],
      },
    });
  }

  /**
   * Update an existing policy.
   */
  static async updatePolicy(id, data) {
    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Policy not found');
      error.status = 404;
      throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverageAmount !== undefined) updateData.coverageAmount = parseFloat(data.coverageAmount);
    if (data.premium !== undefined) updateData.premium = parseFloat(data.premium);
    if (data.duration !== undefined) updateData.duration = parseInt(data.duration, 10);
    if (data.features !== undefined) updateData.features = data.features;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return prisma.insurancePolicy.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deactivate a policy (soft delete).
   */
  static async deactivatePolicy(id) {
    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Policy not found');
      error.status = 404;
      throw error;
    }

    return prisma.insurancePolicy.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get system wide stats for Admin Dashboard.
   */
  static async getAdminDashboardStats() {
    const [totalUsers, totalPolicies, activePolicies, totalUserPolicies, totalClaims, pendingClaims] = await Promise.all([
      prisma.user.count(),
      prisma.insurancePolicy.count(),
      prisma.insurancePolicy.count({ where: { isActive: true } }),
      prisma.userPolicy.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalPolicies,
      activePolicies,
      totalUserPolicies,
      totalClaims,
      pendingClaims,
    };
  }
}

module.exports = PolicyService;

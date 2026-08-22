const prisma = require('../config/db');
const NotificationService = require('./notification.service');

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
   * Get official digital certificate payload for a user policy.
   */
  static async getPolicyCertificate(userId, userPolicyId) {
    const userPolicy = await prisma.userPolicy.findFirst({
      where: {
        id: userPolicyId,
        userId,
      },
      include: {
        policy: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!userPolicy) {
      const error = new Error('Policy certificate not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const cleanId = userPolicy.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
    const certNumber = `CERT-PS-${cleanId}-2026`;
    const verificationHash = `PS-VERIFY-${Buffer.from(`${userPolicy.id}:${userPolicy.userId}`).toString('hex').slice(0, 12).toUpperCase()}`;

    return {
      certificateNumber: certNumber,
      verificationHash,
      issuedAt: userPolicy.createdAt,
      userPolicy,
    };
  }

  /**
   * Renew an active or expiring policy with No Claim Bonus (NCB) discount calculation.
   */
  static async renewUserPolicy(userId, userPolicyId) {
    const userPolicy = await prisma.userPolicy.findFirst({
      where: {
        id: userPolicyId,
        userId,
      },
      include: {
        policy: true,
        claims: true,
      },
    });

    if (!userPolicy) {
      const error = new Error('Policy record not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    // No-Claim Bonus (NCB) logic: 15% discount if 0 claims filed
    const hasClaims = userPolicy.claims.length > 0;
    const ncbPercentage = hasClaims ? 0 : 15;
    const basePremium = userPolicy.policy.premium;
    const discountAmount = (basePremium * ncbPercentage) / 100;
    const finalRenewalPremium = basePremium - discountAmount;

    // Extend End Date by policy duration (in months)
    const currentEnd = new Date(userPolicy.endDate);
    const newEnd = new Date(currentEnd > new Date() ? currentEnd : new Date());
    newEnd.setMonth(newEnd.getMonth() + userPolicy.policy.duration);

    // Execute renewal transaction
    const [updatedUserPolicy, payment] = await prisma.$transaction([
      prisma.userPolicy.update({
        where: { id: userPolicyId },
        data: {
          endDate: newEnd,
          status: 'ACTIVE',
        },
        include: { policy: true },
      }),
      prisma.paymentTransaction.create({
        data: {
          userId,
          userPolicyId: userPolicy.id,
          amount: finalRenewalPremium,
          paymentMethod: 'RENEWAL_AUTO',
          transactionRef: `TXN-RNW-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          paymentStatus: 'SUCCESS',
        },
      }),
    ]);

    // System Notification Trigger
    NotificationService.createNotification({
      userId,
      title: 'Policy Renewed Successfully! 🎉',
      message: `Your ${userPolicy.policy.name} has been renewed until ${newEnd.toLocaleDateString()}. ${ncbPercentage > 0 ? `You saved $${discountAmount.toLocaleString()} with your 15% No-Claim Bonus!` : ''}`,
      type: 'RENEWAL_REMINDER',
    }).catch(err => console.error('Notification error:', err));

    return {
      userPolicy: updatedUserPolicy,
      payment,
      ncbPercentage,
      discountAmount,
      finalRenewalPremium,
      extendedUntil: newEnd,
    };
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

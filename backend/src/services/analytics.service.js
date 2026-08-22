const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  static async getOverview() {
    // 1. User Metrics
    const totalUsers = await prisma.user.count();
    const customerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const advisorCount = await prisma.user.count({ where: { role: 'ADVISOR' } });

    // 2. Policy Metrics
    const totalPolicies = await prisma.insurancePolicy.count({ where: { isActive: true } });
    const activeUserPolicies = await prisma.userPolicy.count({ where: { status: 'ACTIVE' } });

    // 3. Financial Metrics (Transactions)
    const successfulTransactions = await prisma.paymentTransaction.findMany({
      where: { paymentStatus: 'SUCCESS' },
      include: {
        userPolicy: {
          include: {
            policy: true,
          },
        },
      },
    });

    const totalRevenue = successfulTransactions.reduce((acc, t) => acc + t.amount, 0);

    // Revenue by category breakdown
    const categoryRevenueMap = {};
    successfulTransactions.forEach((t) => {
      const category = t.userPolicy?.policy?.category || 'OTHER';
      categoryRevenueMap[category] = (categoryRevenueMap[category] || 0) + t.amount;
    });

    const categoryRevenue = Object.keys(categoryRevenueMap).map((cat) => ({
      category: cat,
      revenue: categoryRevenueMap[cat],
    }));

    // 4. Claims Metrics
    const claims = await prisma.claim.findMany();
    const totalClaims = claims.length;

    const claimsByStatus = {
      PENDING: claims.filter((c) => c.status === 'PENDING').length,
      IN_REVIEW: claims.filter((c) => c.status === 'IN_REVIEW').length,
      APPROVED: claims.filter((c) => c.status === 'APPROVED').length,
      REJECTED: claims.filter((c) => c.status === 'REJECTED').length,
    };

    const totalClaimedAmount = claims.reduce((acc, c) => acc + c.amount, 0);
    const approvedClaimedAmount = claims
      .filter((c) => c.status === 'APPROVED')
      .reduce((acc, c) => acc + c.amount, 0);

    const approvalRate = totalClaims > 0
      ? ((claimsByStatus.APPROVED / totalClaims) * 100).toFixed(1)
      : '0.0';

    // 5. Popular Policies Leaderboard
    const policyPopularity = await prisma.userPolicy.groupBy({
      by: ['policyId'],
      _count: { policyId: true },
      orderBy: { _count: { policyId: 'desc' } },
      take: 5,
    });

    const popularPolicyIds = policyPopularity.map((p) => p.policyId);
    const popularPoliciesData = await prisma.insurancePolicy.findMany({
      where: { id: { in: popularPolicyIds } },
    });

    const leaderboard = policyPopularity.map((item) => {
      const policy = popularPoliciesData.find((p) => p.id === item.policyId);
      return {
        id: item.policyId,
        name: policy ? policy.name : 'Unknown Policy',
        provider: policy ? policy.provider : 'N/A',
        category: policy ? policy.category : 'N/A',
        activeSubscriptions: item._count.policyId,
      };
    });

    return {
      financials: {
        totalRevenue,
        transactionCount: successfulTransactions.length,
        categoryRevenue,
      },
      users: {
        totalUsers,
        customers: customerCount,
        advisors: advisorCount,
      },
      policies: {
        totalActivePolicies: totalPolicies,
        activeSubscriptions: activeUserPolicies,
        leaderboard,
      },
      claims: {
        totalClaims,
        byStatus: claimsByStatus,
        totalClaimedAmount,
        approvedClaimedAmount,
        approvalRate,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AnalyticsService;

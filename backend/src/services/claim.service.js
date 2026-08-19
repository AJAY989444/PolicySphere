const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createClaim = async (userId, data) => {
  // Verify the user owns the userPolicy
  const userPolicy = await prisma.userPolicy.findUnique({
    where: { id: data.userPolicyId },
  });

  if (!userPolicy || userPolicy.userId !== userId) {
    throw new Error('UNAUTHORIZED_POLICY_ACCESS');
  }

  // Create the claim
  const claim = await prisma.claim.create({
    data: {
      userPolicyId: data.userPolicyId,
      amount: data.amount,
      description: data.description,
      incidentDate: data.incidentDate,
      documents: data.documents || [],
      status: 'PENDING',
    },
  });

  return claim;
};

const getUserClaims = async (userId) => {
  // Fetch all claims for the user's policies
  const claims = await prisma.claim.findMany({
    where: {
      userPolicy: {
        userId: userId,
      },
    },
    include: {
      userPolicy: {
        include: {
          policy: {
            select: {
              name: true,
              provider: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return claims;
};

const getClaimById = async (userId, claimId) => {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      userPolicy: {
        include: {
          policy: true,
        },
      },
    },
  });

  if (!claim || claim.userPolicy.userId !== userId) {
    return null;
  }

  return claim;
};

const getAllSystemClaims = async () => {
  const claims = await prisma.claim.findMany({
    include: {
      userPolicy: {
        include: {
          policy: {
            select: {
              name: true,
              provider: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return claims;
};

const updateClaimStatus = async (claimId, status) => {
  const claim = await prisma.claim.update({
    where: { id: claimId },
    data: { status },
  });
  return claim;
};

module.exports = {
  createClaim,
  getUserClaims,
  getClaimById,
  getAllSystemClaims,
  updateClaimStatus
};

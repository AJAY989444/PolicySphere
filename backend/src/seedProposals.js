const prisma = require('./config/db');

async function seedDemoProposals() {
  try {
    console.log('🔍 Checking existing users and policies...');
    const users = await prisma.user.findMany({ take: 5 });
    const policies = await prisma.insurancePolicy.findMany({ take: 5 });

    if (users.length === 0 || policies.length === 0) {
      console.log('⚠️ Need at least 1 user and 1 policy in DB to create proposals.');
      process.exit(1);
    }

    const customerUser = users.find(u => u.role === 'CUSTOMER') || users[0];
    const policy = policies[0];

    // Demo Proposal 1: High Risk (Tobacco + Diabetes + Hypertension + Age 54)
    const p1Ref = 'PROP-UW-' + Math.floor(100000 + Math.random() * 900000);
    const proposal1 = await prisma.proposal.create({
      data: {
        proposalRef: p1Ref,
        userId: customerUser.id,
        policyId: policy.id,
        status: 'PENDING_UNDERWRITING',
        step: 4,
        proposerInfo: {
          firstName: 'Rajesh',
          lastName: 'Sharma',
          dob: '1970-05-14',
          age: 56,
          height: 168,
          weight: 88,
          annualIncome: 800000,
          smoker: true,
        },
        membersInfo: [
          { name: 'Rajesh Sharma', relation: 'SELF', age: 56 }
        ],
        medicalHistory: {
          smoker: true,
          tobaccoUse: true,
          alcoholUse: true,
          conditions: ['DIABETES', 'HYPERTENSION'],
          hasPriorSurgery: true,
        },
        lockedPremium: policy.premium,
      },
    });

    // Demo Proposal 2: Medium Risk (Overweight + Asthma)
    const p2Ref = 'PROP-UW-' + Math.floor(100000 + Math.random() * 900000);
    const proposal2 = await prisma.proposal.create({
      data: {
        proposalRef: p2Ref,
        userId: customerUser.id,
        policyId: policy.id,
        status: 'DRAFT',
        step: 3,
        proposerInfo: {
          firstName: 'Priya',
          lastName: 'Patel',
          dob: '1988-08-20',
          age: 38,
          height: 160,
          weight: 82,
          annualIncome: 1200000,
          smoker: false,
        },
        medicalHistory: {
          smoker: false,
          tobaccoUse: false,
          conditions: ['ASTHMA'],
        },
        lockedPremium: policy.premium,
      },
    });

    // Demo Proposal 3: Low Risk (Healthy Standard Applicant)
    const p3Ref = 'PROP-UW-' + Math.floor(100000 + Math.random() * 900000);
    const proposal3 = await prisma.proposal.create({
      data: {
        proposalRef: p3Ref,
        userId: customerUser.id,
        policyId: policy.id,
        status: 'DRAFT',
        step: 4,
        proposerInfo: {
          firstName: 'Amit',
          lastName: 'Verma',
          dob: '1995-02-10',
          age: 31,
          height: 175,
          weight: 70,
          annualIncome: 1500000,
          smoker: false,
        },
        medicalHistory: {
          smoker: false,
          tobaccoUse: false,
          conditions: [],
        },
        lockedPremium: policy.premium,
      },
    });

    console.log('\n✅ Demo Proposals Created Successfully!');
    console.log('----------------------------------------------------');
    console.log(`1. High Risk Proposal ID   : ${proposal1.id} (Ref: ${proposal1.proposalRef})`);
    console.log(`2. Medium Risk Proposal ID : ${proposal2.id} (Ref: ${proposal2.proposalRef})`);
    console.log(`3. Low Risk Proposal ID    : ${proposal3.id} (Ref: ${proposal3.proposalRef})`);
    console.log('----------------------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo proposals:', err);
    process.exit(1);
  }
}

seedDemoProposals();

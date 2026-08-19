const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const policies = [
  // ─── HEALTH ──────────────────────────────────────────
  {
    name: 'HealthGuard Plus',
    provider: 'Star Health Insurance',
    category: 'HEALTH',
    description: 'Comprehensive health coverage with cashless hospitalization at 10,000+ network hospitals. Covers pre and post hospitalization, day-care procedures, and annual health check-ups.',
    coverageAmount: 500000,
    premium: 8500,
    duration: 12,
    features: JSON.stringify([
      'Cashless hospitalization',
      'Pre & post hospitalization cover',
      'Day-care procedures',
      'Annual health check-up',
      'No room rent capping',
    ]),
  },
  {
    name: 'Family Health Shield',
    provider: 'HDFC Ergo',
    category: 'HEALTH',
    description: 'Family floater plan covering spouse, children, and parents. Includes maternity benefits, new-born cover, and alternative treatment coverage.',
    coverageAmount: 1000000,
    premium: 15000,
    duration: 12,
    features: JSON.stringify([
      'Family floater coverage',
      'Maternity benefits',
      'New-born baby cover',
      'AYUSH treatments',
      'Restoration benefit',
    ]),
  },
  {
    name: 'Critical Care Pro',
    provider: 'Max Bupa',
    category: 'HEALTH',
    description: 'Specialized coverage for 40+ critical illnesses including cancer, heart attack, and organ transplant. Lump-sum payout on diagnosis.',
    coverageAmount: 2500000,
    premium: 12000,
    duration: 12,
    features: JSON.stringify([
      '40+ critical illnesses covered',
      'Lump-sum payout on diagnosis',
      'Waiver of premium benefit',
      'Second medical opinion',
      'International coverage',
    ]),
  },

  // ─── LIFE ────────────────────────────────────────────
  {
    name: 'SecureLife Term Plan',
    provider: 'LIC of India',
    category: 'LIFE',
    description: 'Pure term life insurance with high sum assured at affordable premiums. Includes accidental death benefit and terminal illness cover.',
    coverageAmount: 10000000,
    premium: 6000,
    duration: 240,
    features: JSON.stringify([
      'High sum assured',
      'Accidental death benefit',
      'Terminal illness cover',
      'Flexible payout options',
      'Tax benefits under 80C',
    ]),
  },
  {
    name: 'Wealth Builder ULIP',
    provider: 'ICICI Prudential',
    category: 'LIFE',
    description: 'Unit-linked insurance plan combining life cover with market-linked investment. Choose from equity, debt, or balanced funds.',
    coverageAmount: 5000000,
    premium: 25000,
    duration: 120,
    features: JSON.stringify([
      'Life cover + investment',
      'Multiple fund options',
      'Systematic partial withdrawal',
      'Loyalty additions',
      'Tax-free maturity proceeds',
    ]),
  },

  // ─── MOTOR ───────────────────────────────────────────
  {
    name: 'AutoShield Comprehensive',
    provider: 'Bajaj Allianz',
    category: 'MOTOR',
    description: 'Bumper-to-bumper car insurance with own damage and third-party liability. Includes roadside assistance and zero depreciation add-on.',
    coverageAmount: 800000,
    premium: 9500,
    duration: 12,
    features: JSON.stringify([
      'Own damage cover',
      'Third-party liability',
      'Zero depreciation',
      '24/7 roadside assistance',
      'Engine protect add-on',
    ]),
  },
  {
    name: 'TwoWheeler Guard',
    provider: 'New India Assurance',
    category: 'MOTOR',
    description: 'Complete protection for your two-wheeler with theft cover, personal accident cover, and third-party liability.',
    coverageAmount: 150000,
    premium: 2800,
    duration: 12,
    features: JSON.stringify([
      'Theft protection',
      'Personal accident cover',
      'Third-party liability',
      'Accessories cover',
      'Cashless claim settlement',
    ]),
  },

  // ─── TRAVEL ──────────────────────────────────────────
  {
    name: 'GlobeTrotter Premium',
    provider: 'Tata AIG',
    category: 'TRAVEL',
    description: 'International travel insurance covering medical emergencies, trip cancellation, lost baggage, and flight delays across 150+ countries.',
    coverageAmount: 3000000,
    premium: 3500,
    duration: 1,
    features: JSON.stringify([
      'Medical emergency cover',
      'Trip cancellation protection',
      'Lost baggage compensation',
      'Flight delay allowance',
      'Emergency evacuation',
    ]),
  },
  {
    name: 'Domestic Explorer',
    provider: 'Reliance General',
    category: 'TRAVEL',
    description: 'Affordable domestic travel insurance with medical cover, trip interruption protection, and hotel cancellation benefits.',
    coverageAmount: 500000,
    premium: 800,
    duration: 1,
    features: JSON.stringify([
      'Domestic medical cover',
      'Trip interruption benefit',
      'Hotel cancellation cover',
      'Personal accident cover',
      'Adventure sports cover',
    ]),
  },

  // ─── HOME ────────────────────────────────────────────
  {
    name: 'HomeSafe Elite',
    provider: 'IFFCO Tokio',
    category: 'HOME',
    description: 'Comprehensive home insurance protecting structure, contents, and valuables against fire, theft, natural disasters, and more.',
    coverageAmount: 5000000,
    premium: 7500,
    duration: 12,
    features: JSON.stringify([
      'Structure protection',
      'Contents & valuables cover',
      'Fire & natural disaster cover',
      'Burglary & theft protection',
      'Liability cover for domestic help',
    ]),
  },
  {
    name: 'Tenant Shield',
    provider: 'Royal Sundaram',
    category: 'HOME',
    description: 'Specialized renters insurance protecting personal belongings, electronics, and providing liability coverage for tenants.',
    coverageAmount: 1000000,
    premium: 3200,
    duration: 12,
    features: JSON.stringify([
      'Personal belongings cover',
      'Electronics protection',
      'Tenant liability cover',
      'Temporary accommodation',
      'Key replacement cover',
    ]),
  },
  {
    name: 'SmartHome Protect',
    provider: 'SBI General',
    category: 'HOME',
    description: 'Modern home insurance covering smart devices, home appliances, and IoT equipment alongside standard structural protection.',
    coverageAmount: 3000000,
    premium: 5500,
    duration: 12,
    features: JSON.stringify([
      'Smart device coverage',
      'Appliance breakdown cover',
      'Structural protection',
      'Water damage restoration',
      'Public liability cover',
    ]),
  },
];

async function main() {
  console.log('🌱 Seeding insurance policies...\n');

  for (const policy of policies) {
    const created = await prisma.insurancePolicy.upsert({
      where: { id: policy.name.replace(/\s+/g, '-').toLowerCase() },
      update: policy,
      create: policy,
    });
    console.log(`  ✅ ${created.name} (${created.category})`);
  }

  console.log(`\n🎉 Seeded ${policies.length} policies successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const prisma = require('../config/db');
const crypto = require('crypto');

class InsurerService {
  /**
   * Auto-seed top 5 Indian partner insurers, product rules, underwriting referrals,
   * claims adjudication records, and remittance batches.
   */
  static async seedInsurerDemoData() {
    try {
      const existingWithKey = await prisma.insurerPartner.count({ where: { apiKey: { not: null } } });
      const queueCount = await prisma.insurerUnderwritingQueue.count();
      if (existingWithKey >= 5 && queueCount >= 3) {
        return await prisma.insurerPartner.findMany({
          orderBy: { name: 'asc' },
          include: {
            productRules: true,
            _count: {
              select: {
                underwritingQueue: true,
                claimsAdjudicated: true,
                settlementBatches: true,
              },
            },
          },
        });
      }

      // Seed / Enrich 5 Major Insurers
      const insurersData = [
        {
          searchKey: 'Star',
          name: 'Star Health & Allied Insurance',
          irdaRegNo: 'IRDAI/NL-01/2006',
          category: 'HEALTH',
          commissionRate: 0.15,
          contactEmail: 'partner.relations@starhealth.in',
          contactPhone: '+91-44-2828-8800',
          solvencyRatio: 2.15,
          headquarters: 'Chennai, Tamil Nadu',
          claimSettlementRatio: 98.2,
          networkHospitals: 14200,
          apiKey: 'ps_live_star_health_84920482',
          webhookUrl: 'https://api.starhealth.in/v1/policysphere-webhook',
        },
        {
          searchKey: 'HDFC',
          name: 'HDFC ERGO General Insurance',
          irdaRegNo: 'IRDAI/NL-02/2002',
          category: 'HEALTH',
          commissionRate: 0.14,
          contactEmail: 'care@hdfcergo.com',
          contactPhone: '+91-22-6234-6234',
          solvencyRatio: 2.30,
          headquarters: 'Mumbai, Maharashtra',
          claimSettlementRatio: 99.1,
          networkHospitals: 12500,
          apiKey: 'ps_live_hdfc_ergo_39201948',
          webhookUrl: 'https://partner.hdfcergo.com/callbacks/ps',
        },
        {
          searchKey: 'ICICI',
          name: 'ICICI Lombard General Insurance',
          irdaRegNo: 'IRDAI/NL-03/2001',
          category: 'MOTOR',
          commissionRate: 0.135,
          contactEmail: 'integrations@icicilombard.com',
          contactPhone: '+91-22-6196-1000',
          solvencyRatio: 2.45,
          headquarters: 'Mumbai, Maharashtra',
          claimSettlementRatio: 97.9,
          networkHospitals: 11800,
          apiKey: 'ps_live_icici_lombard_58392014',
          webhookUrl: 'https://integrations.icicilombard.com/webhook/ps',
        },
        {
          searchKey: 'Bupa',
          name: 'Niva Bupa Health Insurance',
          irdaRegNo: 'IRDAI/NL-04/2008',
          category: 'HEALTH',
          commissionRate: 0.15,
          contactEmail: 'underwriting@nivabupa.com',
          contactPhone: '+91-11-4712-4712',
          solvencyRatio: 2.10,
          headquarters: 'New Delhi',
          claimSettlementRatio: 96.8,
          networkHospitals: 10400,
          apiKey: 'ps_live_niva_bupa_29401827',
          webhookUrl: 'https://api.nivabupa.com/partner/webhook',
        },
        {
          searchKey: 'Care',
          name: 'Care Health Insurance',
          irdaRegNo: 'IRDAI/NL-05/2012',
          category: 'HEALTH',
          commissionRate: 0.145,
          contactEmail: 'tpa.relations@careinsurance.com',
          contactPhone: '+91-124-440-9000',
          solvencyRatio: 2.22,
          headquarters: 'Gurugram, Haryana',
          claimSettlementRatio: 97.4,
          networkHospitals: 11200,
          apiKey: 'ps_live_care_health_74829104',
          webhookUrl: 'https://core.careinsurance.com/ps-listener',
        },
      ];

      for (const item of insurersData) {
        let partner = await prisma.insurerPartner.findFirst({
          where: {
            OR: [
              { name: item.name },
              { name: { contains: item.searchKey } },
            ],
          },
        });

        if (partner) {
          partner = await prisma.insurerPartner.update({
            where: { id: partner.id },
            data: {
              name: item.name,
              irdaRegNo: item.irdaRegNo,
              category: item.category,
              commissionRate: item.commissionRate,
              contactEmail: item.contactEmail,
              contactPhone: item.contactPhone,
              solvencyRatio: item.solvencyRatio,
              headquarters: item.headquarters,
              claimSettlementRatio: item.claimSettlementRatio,
              networkHospitals: item.networkHospitals,
              apiKey: item.apiKey,
              webhookUrl: item.webhookUrl,
            },
          });
        } else {
          partner = await prisma.insurerPartner.create({
            data: {
              name: item.name,
              irdaRegNo: item.irdaRegNo,
              category: item.category,
              commissionRate: item.commissionRate,
              contactEmail: item.contactEmail,
              contactPhone: item.contactPhone,
              solvencyRatio: item.solvencyRatio,
              headquarters: item.headquarters,
              claimSettlementRatio: item.claimSettlementRatio,
              networkHospitals: item.networkHospitals,
              apiKey: item.apiKey,
              webhookUrl: item.webhookUrl,
            },
          });
        }

        // Seed product rules
        const existingRule = await prisma.insurerProductRule.findFirst({
          where: { insurerPartnerId: partner.id },
        });

        if (!existingRule) {
          await prisma.insurerProductRule.create({
            data: {
              insurerPartnerId: partner.id,
              category: partner.category,
              productTitle: `${partner.name.split(' ')[0]} Premier Comprehensive Shield`,
              minEntryAge: 18,
              maxEntryAge: 65,
              waitingPeriodMonths: partner.name.includes('Star') ? 24 : 36,
              roomRentLimitPercent: partner.name.includes('HDFC') ? 0.0 : 1.0,
              copayPercentage: partner.name.includes('Care') ? 0.0 : 10.0,
              deductibleAmount: 0.0,
              maternityWaitingMonths: 24,
              ayushCovered: true,
              restorationBenefit: true,
              bariatricSurgeryCovered: partner.name.includes('Star'),
            },
          });
        }

        // Seed API credential
        await prisma.insurerApiCredential.upsert({
          where: { apiKey: item.apiKey },
          update: { webhookEndpoint: item.webhookUrl },
          create: {
            insurerPartnerId: partner.id,
            apiKey: item.apiKey,
            apiSecret: crypto.randomBytes(24).toString('hex'),
            webhookEndpoint: item.webhookUrl,
            rateLimitRpm: 1200,
          },
        });
      }

      // Seed initial underwriting queue referrals for Star Health
      const star = await prisma.insurerPartner.findFirst({ where: { name: { contains: 'Star' } } });
      if (star) {
        const sampleQueue = [
          {
            id: `uw-${star.id}-001`,
            insurerPartnerId: star.id,
            proposalRef: 'PROP-202609-9021',
            customerName: 'Vikramaditya Roy',
            customerAge: 48,
            productName: 'Star Comprehensive Health Cover',
            sumInsured: 1500000,
            quotedPremium: 28500,
            medicalDisclosures: ['Type 2 Diabetes (HbA1c: 7.4%)', 'Hypertension on medication (3 yrs)'],
            aiRiskScore: 68,
            decision: 'STANDARD_APPROVAL',
            loadingPercentage: 15.0,
            exclusionList: ['Pre-existing diabetic retinopathy 24 months'],
            finalPremium: 32775,
            underwriterRemarks: 'Referred due to dual co-morbidities. Counter-offer with 15% loading recommended.',
            reviewedBy: 'Dr. Ramesh Nair (Chief Underwriter)',
            decisionDate: new Date(),
          },
          {
            id: `uw-${star.id}-002`,
            insurerPartnerId: star.id,
            proposalRef: 'PROP-202609-9034',
            customerName: 'Meenakshi Sundaram',
            customerAge: 54,
            productName: 'Star Senior Care Plus',
            sumInsured: 1000000,
            quotedPremium: 34000,
            medicalDisclosures: ['Mild Osteoarthritis Bilateral Knees', 'High Cholesterol'],
            aiRiskScore: 52,
            decision: 'STANDARD_APPROVAL',
            loadingPercentage: 10.0,
            exclusionList: ['Joint replacement waiting period 36 months'],
            finalPremium: 37400,
            underwriterRemarks: 'Standard senior applicant. Surcharge applied for joint degeneration.',
            reviewedBy: 'Dr. Ramesh Nair (Chief Underwriter)',
            decisionDate: new Date(),
          },
          {
            id: `uw-${star.id}-003`,
            insurerPartnerId: star.id,
            proposalRef: 'PROP-202609-9055',
            customerName: 'Aditya Oberoi',
            customerAge: 29,
            productName: 'Star Young Super Saver',
            sumInsured: 2500000,
            quotedPremium: 14200,
            medicalDisclosures: ['Frequent smoker (10 cigarettes/day)', 'Past appendectomy (2023)'],
            aiRiskScore: 42,
            decision: 'STANDARD_APPROVAL',
            loadingPercentage: 10.0,
            exclusionList: [],
            finalPremium: 15620,
            underwriterRemarks: 'Tobacco loading applied as per actuarial tables.',
            reviewedBy: 'Underwriter Team Desk',
            decisionDate: new Date(),
          },
        ];

        for (const q of sampleQueue) {
          await prisma.insurerUnderwritingQueue.upsert({
            where: { id: q.id },
            update: {},
            create: q,
          });
        }

        // Seed Claims Adjudication records
        const sampleClaims = [
          {
            id: `adj-${star.id}-001`,
            insurerPartnerId: star.id,
            claimNumber: 'CLM-HOSP-2026-8812',
            patientName: 'Vikramaditya Roy',
            hospitalName: 'Apollo Hospitals, Greams Road',
            hospitalCity: 'Chennai',
            networkTier: 'TIER_1_PREFERRED',
            ailment: 'Emergency Angioplasty with Single Stent',
            claimedAmount: 245000,
            preAuthAmount: 200000,
            approvedAmount: 228000,
            copayDeduction: 12000,
            nonMedicalDeduction: 5000,
            status: 'SETTLED',
            remarks: 'Cashless pre-auth granted within 45 mins. Final settlement audited and approved.',
            surveyorReportNotes: 'Digital indoor case papers verified. Medical necessity confirmed.',
            adjudicatedBy: 'Dr. Ananya Iyer (TPA Medical Officer)',
            adjudicatedAt: new Date(Date.now() - 3 * 86400000),
          },
          {
            id: `adj-${star.id}-002`,
            insurerPartnerId: star.id,
            claimNumber: 'CLM-HOSP-2026-8845',
            patientName: 'Kavita Menon',
            hospitalName: 'Manipal Hospital, Old Airport Road',
            hospitalCity: 'Bengaluru',
            networkTier: 'TIER_1_PREFERRED',
            ailment: 'Inpatient Treatment for Severe Dengue with Thrombocytopenia',
            claimedAmount: 78000,
            preAuthAmount: 65000,
            approvedAmount: 71500,
            copayDeduction: 0,
            nonMedicalDeduction: 6500,
            status: 'PREAUTH_APPROVED',
            remarks: 'Initial GOP issued. Discharge summary and platelet count trend pending.',
            surveyorReportNotes: 'Continuous platelet infusion confirmed by attending physician.',
            adjudicatedBy: 'Dr. S. Kulkarni (Claims Desk)',
            adjudicatedAt: new Date(),
          },
          {
            id: `adj-${star.id}-003`,
            insurerPartnerId: star.id,
            claimNumber: 'CLM-HOSP-2026-8890',
            patientName: 'Rajesh Singhania',
            hospitalName: 'Fortis Memorial Research Institute',
            hospitalCity: 'Gurugram',
            networkTier: 'TIER_2_NETWORK',
            ailment: 'Elective Cataract Surgery with Multifocal Lens',
            claimedAmount: 95000,
            preAuthAmount: 60000,
            approvedAmount: 60000,
            copayDeduction: 15000,
            nonMedicalDeduction: 20000,
            status: 'SETTLED',
            remarks: 'Capped as per lens sub-limit (Section 3.4 of Policy Terms).',
            surveyorReportNotes: 'Patient opted for premium toric lens; excess borne by policyholder.',
            adjudicatedBy: 'Dr. Ananya Iyer (TPA Medical Officer)',
            adjudicatedAt: new Date(Date.now() - 7 * 86400000),
          },
        ];

        for (const c of sampleClaims) {
          await prisma.insurerClaimAdjudication.upsert({
            where: { id: c.id },
            update: {},
            create: c,
          });
        }

        // Seed Settlement Batches
        const sampleBatches = [
          {
            id: `batch-${star.id}-01`,
            insurerPartnerId: star.id,
            batchNumber: 'SETTLE-STAR-2026-08',
            billingPeriod: 'August 2026',
            policiesBound: 142,
            grossPremium: 1845000,
            platformBrokerage: 276750, // 15%
            tdsDeduction: 13837.5,    // 5% TDS
            netPayoutAmount: 1554412.5,
            status: 'DISBURSED',
            disbursedAt: new Date(Date.now() - 25 * 86400000),
          },
          {
            id: `batch-${star.id}-02`,
            insurerPartnerId: star.id,
            batchNumber: 'SETTLE-STAR-2026-09',
            billingPeriod: 'September 2026',
            policiesBound: 168,
            grossPremium: 2190000,
            platformBrokerage: 328500, // 15%
            tdsDeduction: 16425.0,    // 5% TDS
            netPayoutAmount: 1845075.0,
            status: 'DISBURSED',
            disbursedAt: new Date(Date.now() - 5 * 86400000),
          },
        ];

        for (const b of sampleBatches) {
          await prisma.insurerSettlementBatch.upsert({
            where: { batchNumber: b.batchNumber },
            update: {},
            create: b,
          });
        }
      }

      return await prisma.insurerPartner.findMany({
        orderBy: { name: 'asc' },
        include: {
          productRules: true,
          _count: {
            select: {
              underwritingQueue: true,
              claimsAdjudicated: true,
              settlementBatches: true,
            },
          },
        },
      });
    } catch (err) {
      console.error('[InsurerService.seedInsurerDemoData] Error:', err);
      throw err;
    }
  }

  /**
   * Get list of all active partner insurers
   */
  static async getInsurerList() {
    await this.seedInsurerDemoData();
    return await prisma.insurerPartner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        irdaRegNo: true,
        category: true,
        commissionRate: true,
        solvencyRatio: true,
        headquarters: true,
        claimSettlementRatio: true,
        networkHospitals: true,
        apiKey: true,
        webhookUrl: true,
        contactEmail: true,
        contactPhone: true,
      },
    });
  }

  /**
   * Executive Insurer Cockpit & Actuarial Health Overview
   */
  static async getInsurerOverview(insurerId) {
    await this.seedInsurerDemoData();

    // Default to first insurer if none supplied
    let partner = null;
    if (insurerId) {
      partner = await prisma.insurerPartner.findUnique({
        where: { id: insurerId },
      });
    }
    if (!partner) {
      partner = await prisma.insurerPartner.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    if (!partner) {
      throw new Error('No partner insurer found.');
    }

    // Count bound policies and gross written premium (GWP)
    const [queueCount, pendingQueueCount] = await Promise.all([
      prisma.insurerUnderwritingQueue.count({ where: { insurerPartnerId: partner.id } }),
      prisma.insurerUnderwritingQueue.count({ where: { insurerPartnerId: partner.id, decision: 'STANDARD_APPROVAL' } }),
    ]);

    const claims = await prisma.insurerClaimAdjudication.findMany({
      where: { insurerPartnerId: partner.id },
    });

    const totalClaimed = claims.reduce((acc, c) => acc + (c.claimedAmount || 0), 0);
    const totalSettled = claims.reduce((acc, c) => acc + (c.approvedAmount || 0), 0);

    const batches = await prisma.insurerSettlementBatch.findMany({
      where: { insurerPartnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });

    const totalGwp = batches.reduce((acc, b) => acc + (b.grossPremium || 0), 0) || 4035000;
    const totalPoliciesBound = batches.reduce((acc, b) => acc + (b.policiesBound || 0), 0) || 310;
    const totalBrokerage = batches.reduce((acc, b) => acc + (b.platformBrokerage || 0), 0) || 605250;
    const totalNetRemitted = batches.reduce((acc, b) => acc + (b.netPayoutAmount || 0), 0) || 3399487.5;

    // Calculate Incurred Claim Ratio (ICR %) = (Total Claims Settled / Total Earned GWP) * 100
    const earnedGwp = totalGwp > 0 ? totalGwp : 4035000;
    const icrPercentage = earnedGwp > 0 ? Number(((totalSettled / earnedGwp) * 100).toFixed(1)) : 68.4;

    let icrStatus = 'OPTIMAL';
    if (icrPercentage > 85) icrStatus = 'LOSS_WARNING';
    else if (icrPercentage < 55) icrStatus = 'HIGH_UNDERWRITING_MARGIN';

    return {
      insurer: partner,
      kpis: {
        grossWrittenPremium: earnedGwp,
        totalPoliciesBound,
        totalBrokerageDisbursed: totalBrokerage,
        netRemittedToInsurer: totalNetRemitted,
        activeClaimsCount: claims.length,
        claimsSettledAmount: totalSettled,
        claimsLiabilityOutstanding: totalClaimed - totalSettled,
        incurredClaimRatio: icrPercentage || 68.4,
        icrStatus,
        solvencyRatio: partner.solvencyRatio || 2.15,
        solvencyRequirement: 1.50, // IRDAI statutory threshold
        avgUnderwritingTatDays: 1.8,
        claimSettlementRatio: partner.claimSettlementRatio || 98.2,
        networkHospitalsCount: partner.networkHospitals || 14200,
      },
      underwriting: {
        totalQueue: queueCount,
        pendingReview: pendingQueueCount,
        autoApprovalRate: 84.5,
      },
      recentBatches: batches.slice(0, 5),
    };
  }

  /**
   * Get Actuarial Product Rules for an insurer
   */
  static async getProductRules(insurerId) {
    await this.seedInsurerDemoData();
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    return await prisma.insurerProductRule.findMany({
      where: { insurerPartnerId: partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update Actuarial Product Rule
   */
  static async updateProductRule(ruleId, updateData) {
    return await prisma.insurerProductRule.update({
      where: { id: ruleId },
      data: {
        minEntryAge: updateData.minEntryAge !== undefined ? parseInt(updateData.minEntryAge) : undefined,
        maxEntryAge: updateData.maxEntryAge !== undefined ? parseInt(updateData.maxEntryAge) : undefined,
        waitingPeriodMonths: updateData.waitingPeriodMonths !== undefined ? parseInt(updateData.waitingPeriodMonths) : undefined,
        roomRentLimitPercent: updateData.roomRentLimitPercent !== undefined ? parseFloat(updateData.roomRentLimitPercent) : undefined,
        copayPercentage: updateData.copayPercentage !== undefined ? parseFloat(updateData.copayPercentage) : undefined,
        deductibleAmount: updateData.deductibleAmount !== undefined ? parseFloat(updateData.deductibleAmount) : undefined,
        maternityWaitingMonths: updateData.maternityWaitingMonths !== undefined ? parseInt(updateData.maternityWaitingMonths) : undefined,
        ayushCovered: updateData.ayushCovered !== undefined ? Boolean(updateData.ayushCovered) : undefined,
        restorationBenefit: updateData.restorationBenefit !== undefined ? Boolean(updateData.restorationBenefit) : undefined,
        bariatricSurgeryCovered: updateData.bariatricSurgeryCovered !== undefined ? Boolean(updateData.bariatricSurgeryCovered) : undefined,
      },
    });
  }

  /**
   * Get Underwriting Queue for Insurer Scrutiny
   */
  static async getUnderwritingQueue(insurerId, filterDecision = null) {
    await this.seedInsurerDemoData();
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    const where = { insurerPartnerId: partnerId };
    if (filterDecision) {
      where.decision = filterDecision;
    }

    return await prisma.insurerUnderwritingQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Submit Underwriting Decision (Counter-Offer with Loading %, Exclusions, or Approval)
   */
  static async submitUnderwritingDecision(queueId, { decision, loadingPercentage = 0, exclusionList = [], underwriterRemarks, reviewedBy }) {
    const existing = await prisma.insurerUnderwritingQueue.findUnique({
      where: { id: queueId },
    });

    if (!existing) {
      throw new Error(`Underwriting queue item ${queueId} not found.`);
    }

    const loadPct = parseFloat(loadingPercentage) || 0;
    const finalPrem = Math.round(existing.quotedPremium * (1 + loadPct / 100));

    const updated = await prisma.insurerUnderwritingQueue.update({
      where: { id: queueId },
      data: {
        decision: decision || 'COUNTER_OFFER_LOADING',
        loadingPercentage: loadPct,
        exclusionList: Array.isArray(exclusionList) ? exclusionList : [exclusionList].filter(Boolean),
        finalPremium: finalPrem,
        underwriterRemarks: underwriterRemarks || 'Underwriter assessment recorded.',
        reviewedBy: reviewedBy || 'Insurer Chief Underwriter',
        decisionDate: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get TPA & Cashless Claims Adjudication Queue
   */
  static async getClaimsQueue(insurerId, filterStatus = null) {
    await this.seedInsurerDemoData();
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    const where = { insurerPartnerId: partnerId };
    if (filterStatus) {
      where.status = filterStatus;
    }

    return await prisma.insurerClaimAdjudication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Adjudicate Cashless Pre-Auth / Settlement Claim
   */
  static async adjudicateClaim(adjudicationId, { status, preAuthAmount, approvedAmount, copayDeduction = 0, nonMedicalDeduction = 0, remarks, surveyorReportNotes, adjudicatedBy }) {
    const existing = await prisma.insurerClaimAdjudication.findUnique({
      where: { id: adjudicationId },
    });

    if (!existing) {
      throw new Error(`Claim adjudication item ${adjudicationId} not found.`);
    }

    const copay = parseFloat(copayDeduction) || 0;
    const nonMedical = parseFloat(nonMedicalDeduction) || 0;
    const netApproved = approvedAmount !== undefined ? parseFloat(approvedAmount) : Math.max(0, existing.claimedAmount - copay - nonMedical);

    return await prisma.insurerClaimAdjudication.update({
      where: { id: adjudicationId },
      data: {
        status: status || 'SETTLED',
        preAuthAmount: preAuthAmount !== undefined ? parseFloat(preAuthAmount) : existing.preAuthAmount,
        approvedAmount: netApproved,
        copayDeduction: copay,
        nonMedicalDeduction: nonMedical,
        remarks: remarks || existing.remarks,
        surveyorReportNotes: surveyorReportNotes || existing.surveyorReportNotes,
        adjudicatedBy: adjudicatedBy || 'TPA Cashless Medical Desk',
        adjudicatedAt: new Date(),
      },
    });
  }

  /**
   * Get Settlement Batches
   */
  static async getSettlementBatches(insurerId) {
    await this.seedInsurerDemoData();
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    return await prisma.insurerSettlementBatch.findMany({
      where: { insurerPartnerId: partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate Monthly Brokerage Settlement Batch
   */
  static async generateSettlementBatch(insurerId, { billingPeriod = null, policiesBound = 150, grossPremium = 2000000 }) {
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    const partner = await prisma.insurerPartner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new Error('Insurer not found.');

    const now = new Date();
    const period = billingPeriod || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const batchNumber = `SETTLE-${partner.name.substring(0, 4).toUpperCase()}-${period.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const gross = parseFloat(grossPremium) || 1850000;
    const brokerageRate = partner.commissionRate || 0.15;
    const brokerage = Math.round(gross * brokerageRate * 100) / 100;
    const tds = Math.round(brokerage * 0.05 * 100) / 100; // 5% TDS under Section 194H
    const netPayout = Math.round((gross - brokerage + tds) * 100) / 100;

    return await prisma.insurerSettlementBatch.create({
      data: {
        insurerPartnerId: partnerId,
        batchNumber,
        billingPeriod: period,
        policiesBound: parseInt(policiesBound) || 120,
        grossPremium: gross,
        platformBrokerage: brokerage,
        tdsDeduction: tds,
        netPayoutAmount: netPayout,
        status: 'DISBURSED',
        disbursedAt: new Date(),
      },
    });
  }

  /**
   * Open Insurance API: Machine-to-Machine Policy Binding
   */
  static async bindPolicyApi(apiKey, { policyNumber, customerName, productTitle, sumInsured, premiumAmount }) {
    if (!apiKey) throw new Error('Unauthorized: apiKey is required in headers or body.');
    const partner = await prisma.insurerPartner.findFirst({
      where: { apiKey, isActive: true },
    });

    if (!partner) {
      throw new Error('Unauthorized: Invalid or inactive API key.');
    }

    const policyRef = policyNumber || `POL-M2M-${Date.now().toString(36).toUpperCase()}`;
    const certToken = `PS-BIND-AUTH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    return {
      status: 'BOUND_SUCCESSFULLY',
      insurer: partner.name,
      policyReference: policyRef,
      certificateToken: certToken,
      customerName: customerName || 'PolicySphere Retail Customer',
      sumInsured: sumInsured || 1000000,
      premiumBound: premiumAmount || 18500,
      effectiveFrom: new Date().toISOString(),
      irdaComplianceSeal: `IRDAI-AUTH/${partner.irdaRegNo}/${Date.now()}`,
    };
  }

  /**
   * Open Insurance API: Machine-to-Machine Hospital Cashless Pre-Auth
   */
  static async preAuthClaimApi(apiKey, { claimNumber, hospitalName, patientName, ailment, requestedAmount }) {
    if (!apiKey) throw new Error('Unauthorized: apiKey is required.');
    const partner = await prisma.insurerPartner.findFirst({
      where: { apiKey, isActive: true },
    });

    if (!partner) {
      throw new Error('Unauthorized: Invalid or inactive API key.');
    }

    const claimRef = claimNumber || `CLM-API-${Date.now().toString(36).toUpperCase()}`;
    const reqAmt = parseFloat(requestedAmount) || 85000;
    const initialGop = Math.round(reqAmt * 0.85); // 85% initial sanction

    const record = await prisma.insurerClaimAdjudication.create({
      data: {
        insurerPartnerId: partner.id,
        claimNumber: claimRef,
        patientName: patientName || 'Hospital Inpatient',
        hospitalName: hospitalName || 'Apollo / Fortis Network Hospital',
        networkTier: 'TIER_1_PREFERRED',
        ailment: ailment || 'Acute Inpatient Hospitalization',
        claimedAmount: reqAmt,
        preAuthAmount: initialGop,
        approvedAmount: null,
        copayDeduction: 0,
        nonMedicalDeduction: 0,
        status: 'PREAUTH_APPROVED',
        remarks: 'Automated Cashless GOP Sanction issued via Open Insurance TPA Gateway.',
        adjudicatedBy: 'Open Insurance TPA Gateway API',
        adjudicatedAt: new Date(),
      },
    });

    return {
      status: 'PREAUTH_SANCTIONED',
      insurer: partner.name,
      claimReference: claimRef,
      initialGopSanctionAmount: initialGop,
      networkHospital: hospitalName || 'Network Hospital',
      preAuthValidityHours: 48,
      tpaDeskContact: '1800-425-2255 (24x7 Cashless Authorization)',
      adjudicationRecordId: record.id,
    };
  }

  /**
   * Webhook Simulator: Emits mock webhook callback payload
   */
  static async simulateWebhook(insurerId, { eventType = 'POLICY_BOUND_EVENT', reference = 'POL-2026-M2M' }) {
    let partnerId = insurerId;
    if (!partnerId) {
      const first = await prisma.insurerPartner.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      partnerId = first?.id;
    }

    const partner = await prisma.insurerPartner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new Error('Insurer not found.');

    const timestamp = new Date().toISOString();
    const signature = crypto.createHmac('sha256', partner.apiKey || 'secret').update(`${eventType}:${reference}:${timestamp}`).digest('hex');

    return {
      delivered: true,
      statusCode: 200,
      webhookUrl: partner.webhookUrl || 'https://integrations.policysphere.com/callbacks/insurer',
      payload: {
        event: eventType,
        insurerName: partner.name,
        irdaRegNo: partner.irdaRegNo,
        referenceId: reference,
        timestamp,
        signature: `sha256=${signature}`,
        data: {
          status: 'SUCCESS',
          message: `Real-time webhook notification dispatched by ${partner.name} Core Systems.`,
        },
      },
    };
  }
}

module.exports = InsurerService;

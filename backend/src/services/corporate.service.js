const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CorporateService {
  /**
   * Helper: Ensure default demo corporate account and sample policies/employees exist
   */
  static async seedCorporateDemoData() {
    const existing = await prisma.corporateAccount.findFirst({
      include: {
        groupPolicies: true,
        employees: {
          include: { dependents: true },
        },
        claims: true,
        invoices: true,
      },
    });

    if (existing && existing.employees.length > 0) {
      return existing;
    }

    // Create Acme Technologies India Pvt Ltd
    let account = existing;
    if (!account) {
      account = await prisma.corporateAccount.create({
        data: {
          companyName: 'Acme Technologies India Pvt Ltd',
          companyDomain: 'acmetech.in',
          cinNumber: 'U72200MH2021PTC361234',
          gstinNumber: '27AABCA1234A1Z5',
          industry: 'Enterprise SaaS & Cloud Infrastructure',
          employeeCount: 15,
          hrContactName: 'Ananya Sharma',
          hrContactEmail: 'hr@acmetech.in',
          hrContactPhone: '+91 98201 12345',
          walletBalance: 150000.0,
          isActive: true,
        },
      });
    }

    // Seed 3 Group Policies
    const existingPolicies = await prisma.groupPolicy.findMany({
      where: { corporateAccountId: account.id },
    });

    if (existingPolicies.length === 0) {
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      await prisma.groupPolicy.createMany({
        data: [
          {
            corporateAccountId: account.id,
            policyNumber: 'GMC-ACME-2026-001',
            policyType: 'GMC',
            title: 'Comprehensive Group Health Insurance (GMC)',
            insurerName: 'Star Health & Allied Insurance',
            totalSumInsured: 500000.0,
            premiumPerEmployee: 750.0,
            annualPremium: 135000.0,
            waitingPeriodWaived: true,
            maternityCovered: true,
            preExistingCovered: true,
            cashlessHospitals: 14200,
            startDate: now,
            endDate: oneYearLater,
            isActive: true,
          },
          {
            corporateAccountId: account.id,
            policyNumber: 'GPA-ACME-2026-002',
            policyType: 'GPA',
            title: 'Corporate Group Personal Accident Cover (GPA)',
            insurerName: 'HDFC ERGO General Insurance',
            totalSumInsured: 1000000.0,
            premiumPerEmployee: 250.0,
            annualPremium: 45000.0,
            waitingPeriodWaived: true,
            maternityCovered: false,
            preExistingCovered: true,
            cashlessHospitals: 9800,
            startDate: now,
            endDate: oneYearLater,
            isActive: true,
          },
          {
            corporateAccountId: account.id,
            policyNumber: 'GTL-ACME-2026-003',
            policyType: 'GTL',
            title: 'Corporate Group Term Life Insurance (GTL)',
            insurerName: 'ICICI Prudential Life Insurance',
            totalSumInsured: 2500000.0,
            premiumPerEmployee: 400.0,
            annualPremium: 72000.0,
            waitingPeriodWaived: true,
            maternityCovered: false,
            preExistingCovered: true,
            cashlessHospitals: 0,
            startDate: now,
            endDate: oneYearLater,
            isActive: true,
          },
        ],
      });
    }

    const gmcPolicy = await prisma.groupPolicy.findFirst({
      where: { corporateAccountId: account.id, policyType: 'GMC' },
    });

    // Seed 15 Diverse Employees
    const existingEmployees = await prisma.corporateEmployee.findMany({
      where: { corporateAccountId: account.id },
    });

    if (existingEmployees.length === 0) {
      const sampleEmployees = [
        {
          code: 'EMP-001',
          name: 'Ananya Sharma',
          email: 'ananya.sharma@acmetech.in',
          dept: 'Human Resources',
          designation: 'Head of People & Culture',
          tier: 'EXECUTIVE',
          coverage: 1000000.0,
          ecard: 'PS-ECARD-901001',
          dependents: [
            { name: 'Kunal Sharma', relation: 'SPOUSE', gender: 'MALE' },
            { name: 'Sarita Sharma', relation: 'PARENT', gender: 'FEMALE' },
          ],
        },
        {
          code: 'EMP-002',
          name: 'Vikram Malhotra',
          email: 'vikram.m@acmetech.in',
          dept: 'Engineering',
          designation: 'VP of Engineering',
          tier: 'EXECUTIVE',
          coverage: 1000000.0,
          ecard: 'PS-ECARD-901002',
          dependents: [
            { name: 'Ritu Malhotra', relation: 'SPOUSE', gender: 'FEMALE' },
            { name: 'Kabir Malhotra', relation: 'CHILD', gender: 'MALE' },
          ],
        },
        {
          code: 'EMP-003',
          name: 'Priya Patel',
          email: 'priya.patel@acmetech.in',
          dept: 'Product',
          designation: 'Lead Product Manager',
          tier: 'SENIOR',
          coverage: 500000.0,
          ecard: 'PS-ECARD-901003',
          dependents: [
            { name: 'Rahul Patel', relation: 'SPOUSE', gender: 'MALE' },
          ],
        },
        {
          code: 'EMP-004',
          name: 'Rajesh Kumar',
          email: 'rajesh.k@acmetech.in',
          dept: 'Engineering',
          designation: 'Principal Architect',
          tier: 'SENIOR',
          coverage: 500000.0,
          ecard: 'PS-ECARD-901004',
          dependents: [
            { name: 'Sunita Kumar', relation: 'SPOUSE', gender: 'FEMALE' },
            { name: 'Aarav Kumar', relation: 'CHILD', gender: 'MALE' },
          ],
        },
        {
          code: 'EMP-005',
          name: 'Neha Verma',
          email: 'neha.v@acmetech.in',
          dept: 'DevOps & Infra',
          designation: 'DevOps Lead',
          tier: 'SENIOR',
          coverage: 500000.0,
          ecard: 'PS-ECARD-901005',
          dependents: [],
        },
        {
          code: 'EMP-006',
          name: 'Amit Desai',
          email: 'amit.desai@acmetech.in',
          dept: 'Engineering',
          designation: 'Senior Backend Engineer',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901006',
          dependents: [
            { name: 'Pooja Desai', relation: 'SPOUSE', gender: 'FEMALE' },
          ],
        },
        {
          code: 'EMP-007',
          name: 'Sneha Reddy',
          email: 'sneha.reddy@acmetech.in',
          dept: 'Design',
          designation: 'Senior Product Designer',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901007',
          dependents: [],
        },
        {
          code: 'EMP-008',
          name: 'Rohan Gupta',
          email: 'rohan.g@acmetech.in',
          dept: 'Quality Assurance',
          designation: 'SDET Automation Lead',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901008',
          dependents: [
            { name: 'Megha Gupta', relation: 'SPOUSE', gender: 'FEMALE' },
          ],
        },
        {
          code: 'EMP-009',
          name: 'Pooja Nair',
          email: 'pooja.nair@acmetech.in',
          dept: 'Data Science',
          designation: 'Senior Data Scientist',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901009',
          dependents: [],
        },
        {
          code: 'EMP-010',
          name: 'Karthik Iyer',
          email: 'karthik.i@acmetech.in',
          dept: 'Engineering',
          designation: 'Full Stack Engineer',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901010',
          dependents: [],
        },
        {
          code: 'EMP-011',
          name: 'Meera Joshi',
          email: 'meera.j@acmetech.in',
          dept: 'Product',
          designation: 'Technical Writer',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901011',
          dependents: [],
        },
        {
          code: 'EMP-012',
          name: 'Arjun Mehta',
          email: 'arjun.m@acmetech.in',
          dept: 'Sales & Growth',
          designation: 'Enterprise Account Executive',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901012',
          dependents: [
            { name: 'Tara Mehta', relation: 'SPOUSE', gender: 'FEMALE' },
          ],
        },
        {
          code: 'EMP-013',
          name: 'Divya Bhat',
          email: 'divya.bhat@acmetech.in',
          dept: 'Human Resources',
          designation: 'Talent Acquisition Partner',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901013',
          dependents: [],
        },
        {
          code: 'EMP-014',
          name: 'Sanjay Rao',
          email: 'sanjay.rao@acmetech.in',
          dept: 'Finance',
          designation: 'Finance & Controller Lead',
          tier: 'SENIOR',
          coverage: 500000.0,
          ecard: 'PS-ECARD-901014',
          dependents: [
            { name: 'Kavita Rao', relation: 'SPOUSE', gender: 'FEMALE' },
          ],
        },
        {
          code: 'EMP-015',
          name: 'Shreya Sen',
          email: 'shreya.sen@acmetech.in',
          dept: 'Customer Success',
          designation: 'Client Success Manager',
          tier: 'STANDARD',
          coverage: 300000.0,
          ecard: 'PS-ECARD-901015',
          dependents: [],
        },
      ];

      for (const emp of sampleEmployees) {
        const createdEmp = await prisma.corporateEmployee.create({
          data: {
            corporateAccountId: account.id,
            employeeCode: emp.code,
            fullName: emp.name,
            workEmail: emp.email,
            department: emp.dept,
            designation: emp.designation,
            tier: emp.tier,
            coverageAmount: emp.coverage,
            ecardNumber: emp.ecard,
            enrollmentStatus: 'ACTIVE',
          },
        });

        if (emp.dependents && emp.dependents.length > 0) {
          await prisma.corporateDependent.createMany({
            data: emp.dependents.map((d) => ({
              employeeId: createdEmp.id,
              fullName: d.name,
              relation: d.relation,
              gender: d.gender,
              isActive: true,
            })),
          });
        }
      }
    }

    // Seed Sample Claims
    const empPriya = await prisma.corporateEmployee.findFirst({
      where: { workEmail: 'priya.patel@acmetech.in' },
    });
    const empAmit = await prisma.corporateEmployee.findFirst({
      where: { workEmail: 'amit.desai@acmetech.in' },
    });

    const existingClaims = await prisma.corporateClaim.findMany({
      where: { corporateAccountId: account.id },
    });

    if (existingClaims.length === 0 && gmcPolicy && empPriya && empAmit) {
      const now = new Date();
      await prisma.corporateClaim.createMany({
        data: [
          {
            corporateAccountId: account.id,
            employeeId: empPriya.id,
            groupPolicyId: gmcPolicy.id,
            claimNumber: 'CORP-CLM-2026-001',
            patientName: 'Rahul Patel',
            relationship: 'SPOUSE',
            hospitalName: 'Fortis Hospital, Mulund, Mumbai',
            city: 'Mumbai',
            ailment: 'Emergency Laparoscopic Appendectomy',
            admissionDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            dischargeDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
            claimedAmount: 145000.0,
            approvedAmount: 140000.0,
            isCashless: true,
            status: 'SETTLED',
            remarks: 'Cashless pre-authorization approved; copay deducted ₹5,000.',
          },
          {
            corporateAccountId: account.id,
            employeeId: empAmit.id,
            groupPolicyId: gmcPolicy.id,
            claimNumber: 'CORP-CLM-2026-002',
            patientName: 'Amit Desai',
            relationship: 'SELF',
            hospitalName: 'Apollo Hospitals, Bannerghatta Road',
            city: 'Bengaluru',
            ailment: 'Inpatient Treatment for Severe Viral Thrombocytopenia',
            admissionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            dischargeDate: null,
            claimedAmount: 68000.0,
            approvedAmount: null,
            isCashless: true,
            status: 'IN_REVIEW',
            remarks: 'Initial pre-auth granted; discharge summary pending.',
          },
        ],
      });
    }

    // Seed Sample Invoices
    const existingInvoices = await prisma.corporateInvoice.findMany({
      where: { corporateAccountId: account.id },
    });

    if (existingInvoices.length === 0) {
      const now = new Date();
      await prisma.corporateInvoice.createMany({
        data: [
          {
            corporateAccountId: account.id,
            invoiceNumber: 'CORP-INV-2026-08',
            billingPeriod: 'August 2026',
            activeEmployees: 15,
            basePremium: 21000.0,
            gstAmount: 3780.0,
            totalAmount: 24780.0,
            status: 'PAID',
            dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            paidAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          },
          {
            corporateAccountId: account.id,
            invoiceNumber: 'CORP-INV-2026-09',
            billingPeriod: 'September 2026',
            activeEmployees: 15,
            basePremium: 21000.0,
            gstAmount: 3780.0,
            totalAmount: 24780.0,
            status: 'PAID',
            dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
            paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      });
    }

    return prisma.corporateAccount.findUnique({
      where: { id: account.id },
      include: {
        groupPolicies: true,
        employees: {
          include: { dependents: true },
        },
        claims: true,
        invoices: true,
      },
    });
  }

  /**
   * Get or initialize default active corporate account
   */
  static async getDefaultAccount() {
    let account = await prisma.corporateAccount.findFirst({
      where: { isActive: true },
    });
    if (!account) {
      account = await this.seedCorporateDemoData();
    }
    return account;
  }

  /**
   * 1. Overview & Executive Metrics for HR Dashboard
   */
  static async getOverview(corporateAccountId) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    if (!account) {
      throw new Error('Corporate account not found');
    }

    const [
      activeEmployeesCount,
      totalEmployeesCount,
      dependentsCount,
      groupPolicies,
      claims,
      invoices,
    ] = await Promise.all([
      prisma.corporateEmployee.count({
        where: { corporateAccountId: account.id, enrollmentStatus: 'ACTIVE' },
      }),
      prisma.corporateEmployee.count({
        where: { corporateAccountId: account.id },
      }),
      prisma.corporateDependent.count({
        where: {
          employee: { corporateAccountId: account.id, enrollmentStatus: 'ACTIVE' },
          isActive: true,
        },
      }),
      prisma.groupPolicy.findMany({
        where: { corporateAccountId: account.id, isActive: true },
      }),
      prisma.corporateClaim.findMany({
        where: { corporateAccountId: account.id },
      }),
      prisma.corporateInvoice.findMany({
        where: { corporateAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Financial calculations
    const totalEnrolledLives = activeEmployeesCount + dependentsCount;
    const monthlyPEPM = groupPolicies.reduce((sum, p) => sum + p.premiumPerEmployee, 0);
    const monthlyPremiumOutlay = activeEmployeesCount * monthlyPEPM;
    const annualPremiumOutlay = groupPolicies.reduce((sum, p) => sum + p.annualPremium, 0);
    const totalSumInsured = groupPolicies.reduce((sum, p) => sum + p.totalSumInsured, 0);

    // Claims metrics & Incurred Claim Ratio (ICR)
    const totalClaimsCount = claims.length;
    const settledClaimsCount = claims.filter((c) => c.status === 'SETTLED').length;
    const pendingClaimsCount = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW').length;
    const totalClaimedAmount = claims.reduce((sum, c) => sum + c.claimedAmount, 0);
    const totalApprovedAmount = claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0);

    // Incurred Claim Ratio = (Approved Claims / Annual Premium) * 100
    const incurredClaimRatio = annualPremiumOutlay > 0
      ? Number(((totalApprovedAmount / annualPremiumOutlay) * 100).toFixed(1))
      : 0;

    let icrStatus = 'OPTIMAL';
    if (incurredClaimRatio > 85) {
      icrStatus = 'LOSS_WARNING';
    } else if (incurredClaimRatio < 50) {
      icrStatus = 'HIGH_UNDERWRITING_PROFIT';
    }

    // Department Distribution
    const employees = await prisma.corporateEmployee.findMany({
      where: { corporateAccountId: account.id, enrollmentStatus: 'ACTIVE' },
      select: { department: true, tier: true },
    });

    const deptMap = {};
    const tierMap = { EXECUTIVE: 0, SENIOR: 0, STANDARD: 0 };
    employees.forEach((e) => {
      deptMap[e.department] = (deptMap[e.department] || 0) + 1;
      if (tierMap[e.tier] !== undefined) tierMap[e.tier] += 1;
    });

    const departmentBreakdown = Object.keys(deptMap).map((dept) => ({
      name: dept,
      count: deptMap[dept],
      percentage: activeEmployeesCount > 0 ? Math.round((deptMap[dept] / activeEmployeesCount) * 100) : 0,
    }));

    return {
      company: {
        id: account.id,
        name: account.companyName,
        domain: account.companyDomain,
        cin: account.cinNumber,
        gstin: account.gstinNumber,
        industry: account.industry,
        hrName: account.hrContactName,
        hrEmail: account.hrContactEmail,
        walletBalance: account.walletBalance,
      },
      headcount: {
        activeEmployees: activeEmployeesCount,
        totalEmployees: totalEmployeesCount,
        coveredDependents: dependentsCount,
        totalEnrolledLives,
      },
      premiums: {
        monthlyPEPM,
        monthlyOutlay: monthlyPremiumOutlay,
        annualOutlay: annualPremiumOutlay,
        totalSumInsured,
      },
      claims: {
        total: totalClaimsCount,
        settled: settledClaimsCount,
        pending: pendingClaimsCount,
        claimedAmount: totalClaimedAmount,
        approvedAmount: totalApprovedAmount,
        incurredClaimRatio,
        icrStatus,
      },
      policies: groupPolicies.map((p) => ({
        id: p.id,
        policyNumber: p.policyNumber,
        policyType: p.policyType,
        title: p.title,
        insurerName: p.insurerName,
        sumInsured: p.totalSumInsured,
        pepm: p.premiumPerEmployee,
        cashlessHospitals: p.cashlessHospitals,
        waitingPeriodWaived: p.waitingPeriodWaived,
        maternityCovered: p.maternityCovered,
      })),
      demographics: {
        departments: departmentBreakdown,
        tiers: tierMap,
      },
      recentInvoices: invoices,
    };
  }

  /**
   * 2. List Employees with Filtering, Search & Pagination
   */
  static async listEmployees(corporateAccountId, { search = '', department = '', tier = '', status = '', page = 1, limit = 10 } = {}) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const where = { corporateAccountId: account.id };

    if (status) {
      where.enrollmentStatus = status;
    }

    if (tier) {
      where.tier = tier;
    }

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { workEmail: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [employees, total] = await Promise.all([
      prisma.corporateEmployee.findMany({
        where,
        include: {
          dependents: true,
          _count: { select: { claims: true } },
        },
        orderBy: { employeeCode: 'asc' },
        skip,
        take,
      }),
      prisma.corporateEmployee.count({ where }),
    ]);

    return {
      employees: employees.map((emp) => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        tier: emp.tier,
        coverageAmount: emp.coverageAmount,
        enrollmentStatus: emp.enrollmentStatus,
        ecardNumber: emp.ecardNumber,
        joinDate: emp.joinDate,
        dependentsCount: emp.dependents.length,
        dependents: emp.dependents,
        claimsCount: emp._count.claims,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * 3. Add Single Employee to Corporate Roster
   */
  static async addEmployee(corporateAccountId, data) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const { employeeCode, fullName, workEmail, phone, department, designation, tier = 'STANDARD' } = data;

    if (!employeeCode || !fullName || !workEmail) {
      throw new Error('Employee Code, Full Name, and Work Email are required.');
    }

    // Check unique constraints
    const existing = await prisma.corporateEmployee.findFirst({
      where: {
        corporateAccountId: account.id,
        OR: [{ employeeCode }, { workEmail }],
      },
    });

    if (existing) {
      if (existing.employeeCode === employeeCode) {
        throw new Error(`Employee code '${employeeCode}' already exists in organization.`);
      }
      throw new Error(`Work email '${workEmail}' already registered.`);
    }

    // Determine coverage amount by tier
    let coverageAmount = 300000.0;
    if (tier === 'EXECUTIVE') coverageAmount = 1000000.0;
    else if (tier === 'SENIOR') coverageAmount = 500000.0;

    // Generate unique eCard Number
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ecardNumber = `PS-ECARD-${randomSuffix}`;

    const employee = await prisma.corporateEmployee.create({
      data: {
        corporateAccountId: account.id,
        employeeCode,
        fullName,
        workEmail,
        phone,
        department: department || 'Engineering',
        designation: designation || 'Associate',
        tier,
        coverageAmount,
        ecardNumber,
        enrollmentStatus: 'ACTIVE',
      },
    });

    // Increment employee count
    await prisma.corporateAccount.update({
      where: { id: account.id },
      data: { employeeCount: { increment: 1 } },
    });

    return employee;
  }

  /**
   * 4. Bulk Upload Employees via CSV Ingestion
   */
  static async bulkUploadEmployees(corporateAccountId, employeesList) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    if (!Array.isArray(employeesList) || employeesList.length === 0) {
      throw new Error('Invalid employee payload: expected a non-empty array.');
    }

    const inserted = [];
    const skipped = [];

    // Fetch existing codes and emails to avoid collisions
    const existingRecords = await prisma.corporateEmployee.findMany({
      where: { corporateAccountId: account.id },
      select: { employeeCode: true, workEmail: true },
    });

    const existingCodes = new Set(existingRecords.map((r) => r.employeeCode.toUpperCase()));
    const existingEmails = new Set(existingRecords.map((r) => r.workEmail.toLowerCase()));

    for (const item of employeesList) {
      const code = (item.employeeCode || item.code || '').trim().toUpperCase();
      const name = (item.fullName || item.name || '').trim();
      const email = (item.workEmail || item.email || '').trim().toLowerCase();
      const dept = (item.department || item.dept || 'Engineering').trim();
      const desig = (item.designation || 'Associate').trim();
      const tier = ['EXECUTIVE', 'SENIOR', 'STANDARD'].includes((item.tier || '').toUpperCase())
        ? item.tier.toUpperCase()
        : 'STANDARD';

      if (!code || !name || !email) {
        skipped.push({ item, reason: 'Missing required fields (Code, Name, or Email)' });
        continue;
      }

      if (existingCodes.has(code)) {
        skipped.push({ item, reason: `Employee code '${code}' already exists` });
        continue;
      }

      if (existingEmails.has(email)) {
        skipped.push({ item, reason: `Work email '${email}' already registered` });
        continue;
      }

      // Compute coverage by tier
      let coverageAmount = 300000.0;
      if (tier === 'EXECUTIVE') coverageAmount = 1000000.0;
      else if (tier === 'SENIOR') coverageAmount = 500000.0;

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const ecardNumber = `PS-ECARD-${randomSuffix}`;

      try {
        const created = await prisma.corporateEmployee.create({
          data: {
            corporateAccountId: account.id,
            employeeCode: code,
            fullName: name,
            workEmail: email,
            phone: item.phone || null,
            department: dept,
            designation: desig,
            tier,
            coverageAmount,
            ecardNumber,
            enrollmentStatus: 'ACTIVE',
          },
        });

        existingCodes.add(code);
        existingEmails.add(email);
        inserted.push(created);
      } catch (err) {
        skipped.push({ item, reason: err.message });
      }
    }

    // Sync employee count
    if (inserted.length > 0) {
      await prisma.corporateAccount.update({
        where: { id: account.id },
        data: { employeeCount: { increment: inserted.length } },
      });
    }

    return {
      success: true,
      totalReceived: employeesList.length,
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    };
  }

  /**
   * 5. Update Employee Enrollment Status
   */
  static async updateEmployeeStatus(employeeId, status) {
    const validStatuses = ['ACTIVE', 'PENDING_ENROLLMENT', 'OPTED_OUT', 'TERMINATED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const employee = await prisma.corporateEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new Error('Employee not found.');

    const updated = await prisma.corporateEmployee.update({
      where: { id: employeeId },
      data: { enrollmentStatus: status },
    });

    // Re-sync corporate account active count
    const activeCount = await prisma.corporateEmployee.count({
      where: { corporateAccountId: employee.corporateAccountId, enrollmentStatus: 'ACTIVE' },
    });

    await prisma.corporateAccount.update({
      where: { id: employee.corporateAccountId },
      data: { employeeCount: activeCount },
    });

    return updated;
  }

  /**
   * 6. Add Dependent to Employee
   */
  static async addDependent(employeeId, data) {
    const employee = await prisma.corporateEmployee.findUnique({
      where: { id: employeeId },
      include: { dependents: true },
    });

    if (!employee) throw new Error('Employee not found.');

    const { fullName, relation, gender, dateOfBirth } = data;
    if (!fullName || !relation) {
      throw new Error('Dependent Full Name and Relation are required.');
    }

    const validRelations = ['SPOUSE', 'CHILD', 'PARENT'];
    if (!validRelations.includes(relation.toUpperCase())) {
      throw new Error('Relation must be SPOUSE, CHILD, or PARENT.');
    }

    const dependent = await prisma.corporateDependent.create({
      data: {
        employeeId,
        fullName,
        relation: relation.toUpperCase(),
        gender: gender || 'OTHER',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isActive: true,
      },
    });

    return dependent;
  }

  /**
   * 7. Remove Dependent
   */
  static async deleteDependent(dependentId) {
    return prisma.corporateDependent.delete({
      where: { id: dependentId },
    });
  }

  /**
   * 8. List Group Policies
   */
  static async listGroupPolicies(corporateAccountId) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    return prisma.groupPolicy.findMany({
      where: { corporateAccountId: account.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 9. Create Custom Group Policy
   */
  static async createGroupPolicy(corporateAccountId, data) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const {
      policyNumber,
      policyType = 'GMC',
      title,
      insurerName,
      totalSumInsured,
      premiumPerEmployee,
      annualPremium,
      waitingPeriodWaived = true,
      maternityCovered = true,
      preExistingCovered = true,
      cashlessHospitals = 10000,
    } = data;

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return prisma.groupPolicy.create({
      data: {
        corporateAccountId: account.id,
        policyNumber: policyNumber || `GRP-${policyType}-${Date.now().toString().slice(-6)}`,
        policyType,
        title: title || `Corporate ${policyType} Plan`,
        insurerName: insurerName || 'Star Health & Allied Insurance',
        totalSumInsured: Number(totalSumInsured) || 500000.0,
        premiumPerEmployee: Number(premiumPerEmployee) || 600.0,
        annualPremium: Number(annualPremium) || 72000.0,
        waitingPeriodWaived,
        maternityCovered,
        preExistingCovered,
        cashlessHospitals: Number(cashlessHospitals) || 10000,
        startDate: now,
        endDate: oneYearLater,
        isActive: true,
      },
    });
  }

  /**
   * 10. List Corporate Claims
   */
  static async listClaims(corporateAccountId, { status = '', search = '', page = 1, limit = 10 } = {}) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const where = { corporateAccountId: account.id };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
        { hospitalName: { contains: search, mode: 'insensitive' } },
        { ailment: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [claims, total] = await Promise.all([
      prisma.corporateClaim.findMany({
        where,
        include: {
          employee: {
            select: { fullName: true, employeeCode: true, department: true },
          },
          groupPolicy: {
            select: { policyNumber: true, policyType: true, insurerName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.corporateClaim.count({ where }),
    ]);

    return {
      claims: claims.map((c) => ({
        id: c.id,
        claimNumber: c.claimNumber,
        patientName: c.patientName,
        relationship: c.relationship,
        employeeName: c.employee.fullName,
        employeeCode: c.employee.employeeCode,
        department: c.employee.department,
        policyNumber: c.groupPolicy.policyNumber,
        policyType: c.groupPolicy.policyType,
        insurerName: c.groupPolicy.insurerName,
        hospitalName: c.hospitalName,
        city: c.city,
        ailment: c.ailment,
        admissionDate: c.admissionDate,
        dischargeDate: c.dischargeDate,
        claimedAmount: c.claimedAmount,
        approvedAmount: c.approvedAmount,
        isCashless: c.isCashless,
        status: c.status,
        remarks: c.remarks,
        createdAt: c.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * 11. Submit a Corporate Claim
   */
  static async submitClaim(corporateAccountId, data) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const {
      employeeId,
      groupPolicyId,
      patientName,
      relationship = 'SELF',
      hospitalName,
      city = 'Mumbai',
      ailment,
      admissionDate,
      dischargeDate,
      claimedAmount,
      isCashless = true,
      remarks,
    } = data;

    if (!employeeId || !patientName || !hospitalName || !ailment || !claimedAmount) {
      throw new Error('Employee, Patient Name, Hospital, Ailment, and Claim Amount are required.');
    }

    // Default to first active GMC policy if not provided
    let policyId = groupPolicyId;
    if (!policyId) {
      const gmc = await prisma.groupPolicy.findFirst({
        where: { corporateAccountId: account.id, policyType: 'GMC' },
      });
      policyId = gmc ? gmc.id : null;
    }

    if (!policyId) {
      throw new Error('No active group policy found to attach claim.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const claimNumber = `CORP-CLM-${new Date().getFullYear()}-${randomSuffix}`;

    return prisma.corporateClaim.create({
      data: {
        corporateAccountId: account.id,
        employeeId,
        groupPolicyId: policyId,
        claimNumber,
        patientName,
        relationship,
        hospitalName,
        city,
        ailment,
        admissionDate: new Date(admissionDate || Date.now()),
        dischargeDate: dischargeDate ? new Date(dischargeDate) : null,
        claimedAmount: Number(claimedAmount),
        approvedAmount: null,
        isCashless: Boolean(isCashless),
        status: 'SUBMITTED',
        remarks,
      },
    });
  }

  /**
   * 12. Update Corporate Claim Status
   */
  static async updateClaimStatus(claimId, { status, approvedAmount, remarks }) {
    const validStatuses = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'SETTLED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const data = { status };
    if (approvedAmount !== undefined) data.approvedAmount = Number(approvedAmount);
    if (remarks !== undefined) data.remarks = remarks;

    return prisma.corporateClaim.update({
      where: { id: claimId },
      data,
    });
  }

  /**
   * 13. List Invoices
   */
  static async listInvoices(corporateAccountId) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    return prisma.corporateInvoice.findMany({
      where: { corporateAccountId: account.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 14. Generate Monthly PEPM Invoicing
   */
  static async generateMonthlyInvoice(corporateAccountId, billingPeriod) {
    const account = corporateAccountId
      ? await prisma.corporateAccount.findUnique({ where: { id: corporateAccountId } })
      : await this.getDefaultAccount();

    const period = billingPeriod || new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Check if invoice already exists for period
    const existing = await prisma.corporateInvoice.findFirst({
      where: { corporateAccountId: account.id, billingPeriod: period },
    });
    if (existing) return existing;

    const [activeEmployeesCount, groupPolicies] = await Promise.all([
      prisma.corporateEmployee.count({
        where: { corporateAccountId: account.id, enrollmentStatus: 'ACTIVE' },
      }),
      prisma.groupPolicy.findMany({
        where: { corporateAccountId: account.id, isActive: true },
      }),
    ]);

    const totalPEPM = groupPolicies.reduce((sum, p) => sum + p.premiumPerEmployee, 0);
    const basePremium = activeEmployeesCount * totalPEPM;
    const gstAmount = Number((basePremium * 0.18).toFixed(2));
    const totalAmount = Number((basePremium + gstAmount).toFixed(2));

    const invoiceNumber = `CORP-INV-${period.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    return prisma.corporateInvoice.create({
      data: {
        corporateAccountId: account.id,
        invoiceNumber,
        billingPeriod: period,
        activeEmployees: activeEmployeesCount,
        basePremium,
        gstAmount,
        totalAmount,
        status: 'PAID',
        dueDate,
        paidAt: now,
      },
    });
  }

  /**
   * 15. Generate Digital Cashless e-Health Card Payload
   */
  static async getDigitalECard(employeeId) {
    const employee = await prisma.corporateEmployee.findUnique({
      where: { id: employeeId },
      include: {
        corporateAccount: {
          include: {
            groupPolicies: {
              where: { isActive: true, policyType: 'GMC' },
            },
          },
        },
        dependents: {
          where: { isActive: true },
        },
      },
    });

    if (!employee) throw new Error('Employee record not found.');

    const company = employee.corporateAccount;
    const gmcPolicy = company.groupPolicies[0] || null;

    // Generate security token for QR code
    const qrToken = `PS-VAL:${employee.ecardNumber}:${employee.employeeCode}:${company.cinNumber || 'ACME'}:${Date.now()}`;

    return {
      cardId: employee.ecardNumber,
      employee: {
        id: employee.id,
        code: employee.employeeCode,
        name: employee.fullName,
        email: employee.workEmail,
        department: employee.department,
        designation: employee.designation,
        tier: employee.tier,
        sumInsured: employee.coverageAmount,
        joinDate: employee.joinDate,
      },
      company: {
        name: company.companyName,
        cin: company.cinNumber,
      },
      policy: gmcPolicy
        ? {
            policyNumber: gmcPolicy.policyNumber,
            insurerName: gmcPolicy.insurerName,
            type: gmcPolicy.policyType,
            cashlessHospitals: gmcPolicy.cashlessHospitals,
            waitingPeriodWaived: gmcPolicy.waitingPeriodWaived,
            maternityCovered: gmcPolicy.maternityCovered,
            validUntil: gmcPolicy.endDate,
          }
        : {
            policyNumber: 'GMC-DEFAULT-2026',
            insurerName: 'Star Health & Allied Insurance',
            type: 'GMC',
            cashlessHospitals: 14000,
            waitingPeriodWaived: true,
            maternityCovered: true,
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
      dependents: employee.dependents.map((d) => ({
        name: d.fullName,
        relation: d.relation,
        gender: d.gender,
      })),
      support: {
        tpaDesk: '1800-425-2255 (24x7 Cashless Desk)',
        email: 'cashless@policysphere.com',
        networkHospitalsUrl: 'https://policysphere.com/network-hospitals',
      },
      qrPayload: qrToken,
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * 16. Employee Self-Service: My Benefits
   */
  static async getMyBenefits(userEmail) {
    if (!userEmail) throw new Error('User email required.');

    const employee = await prisma.corporateEmployee.findFirst({
      where: { workEmail: { equals: userEmail, mode: 'insensitive' } },
      include: {
        corporateAccount: {
          include: { groupPolicies: { where: { isActive: true } } },
        },
        dependents: true,
        claims: true,
      },
    });

    if (!employee) {
      return null;
    }

    return {
      employee: {
        id: employee.id,
        code: employee.employeeCode,
        name: employee.fullName,
        email: employee.workEmail,
        department: employee.department,
        designation: employee.designation,
        tier: employee.tier,
        sumInsured: employee.coverageAmount,
        ecardNumber: employee.ecardNumber,
      },
      company: {
        name: employee.corporateAccount.companyName,
      },
      policies: employee.corporateAccount.groupPolicies.map((p) => ({
        policyNumber: p.policyNumber,
        type: p.policyType,
        title: p.title,
        insurer: p.insurerName,
        sumInsured: p.totalSumInsured,
      })),
      dependents: employee.dependents,
      claims: employee.claims,
    };
  }
}

module.exports = CorporateService;

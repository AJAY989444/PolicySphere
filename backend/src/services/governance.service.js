const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GovernanceService {
  /**
   * Helper to extract client IP and user-agent from Express request
   */
  static getClientDetails(req) {
    if (!req) return { ipAddress: '127.0.0.1', userAgent: 'System' };
    const ipAddress =
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'Unknown Client';
    return { ipAddress, userAgent };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. IMMUTABLE SECURITY AUDIT TRAIL ENGINE (SRS Section 36)
  // ─────────────────────────────────────────────────────────────
  static async recordAuditLog({
    userId = null,
    action,
    entityType,
    entityId = null,
    req = null,
    previousValue = null,
    newValue = null,
    status = 'SUCCESS',
  }) {
    try {
      const { ipAddress, userAgent } = this.getClientDetails(req);
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          ipAddress,
          userAgent,
          previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : undefined,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
          status,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  static async getAuditLogs({
    page = 1,
    limit = 20,
    action = null,
    entityType = null,
    userId = null,
    search = '',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. GOVERNANCE OVERVIEW & SUMMARY METRICS (SRS Section 20)
  // ─────────────────────────────────────────────────────────────
  static async getGovernanceOverview() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      customersCount,
      advisorsCount,
      adminsCount,
      activePolicies,
      totalPolicies,
      activeCoupons,
      totalInsurers,
      recentAuditEvents,
      maintenanceSetting,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'ADVISOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.insurancePolicy.count({ where: { isActive: true } }),
      prisma.insurancePolicy.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.insurerPartner.count({ where: { isActive: true } }),
      prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } }),
    ]);

    // Check if InsurerPartners need initial seeding
    if (totalInsurers === 0) {
      await this.seedDefaultInsurers();
    }
    // Check if SystemSettings need initial seeding
    await this.ensureDefaultSettings();

    return {
      users: {
        total: totalUsers,
        customers: customersCount,
        advisors: advisorsCount,
        admins: adminsCount,
      },
      policies: {
        active: activePolicies,
        total: totalPolicies,
      },
      promotions: {
        activeCoupons,
      },
      insurers: {
        activeCount: Math.max(totalInsurers, 5),
      },
      security: {
        auditEvents24h: recentAuditEvents,
        maintenanceMode: maintenanceSetting?.value === true,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. USER MANAGEMENT & RBAC (SRS Section 20 & 21)
  // ─────────────────────────────────────────────────────────────
  static async getUsersList({ page = 1, limit = 15, role = null, status = null, search = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (role) where.role = role;
    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'SUSPENDED') where.isActive = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              userPolicies: true,
              payments: true,
              supportTicketsCreated: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
        phone: u.phone || '—',
        role: u.role,
        isActive: u.isActive,
        joinedAt: u.createdAt,
        policyCount: u._count.userPolicies,
        paymentCount: u._count.payments,
        ticketCount: u._count.supportTicketsCreated,
      })),
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async updateUserRole(targetUserId, newRole, adminUser, req) {
    if (!['CUSTOMER', 'ADVISOR', 'ADMIN'].includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error('User not found');

    if (target.id === adminUser.id && newRole !== 'ADMIN') {
      throw new Error('Self-demotion protection: An administrator cannot remove their own admin role.');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'USER_ROLE_UPDATED',
      entityType: 'USER',
      entityId: targetUserId,
      req,
      previousValue: { role: target.role, email: target.email },
      newValue: { role: newRole, email: target.email },
    });

    return updated;
  }

  static async toggleUserStatus(targetUserId, isActive, reason = '', adminUser, req) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error('User not found');

    if (target.id === adminUser.id && !isActive) {
      throw new Error('Self-suspension protection: You cannot suspend your own administrative account.');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    // If user was suspended, immediately revoke all active refresh tokens
    if (!isActive) {
      await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });
    }

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'USER_STATUS_TOGGLED',
      entityType: 'USER',
      entityId: targetUserId,
      req,
      previousValue: { isActive: target.isActive, reason },
      newValue: { isActive, reason },
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. COUPONS & PROMOTIONAL DISCOUNT ENGINE (SRS Section 20)
  // ─────────────────────────────────────────────────────────────
  static async listCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createCoupon(data, adminUser, req) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new Error(`Coupon code '${code}' already exists`);

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: data.description || null,
        discountType: data.discountType || 'PERCENTAGE',
        discountValue: parseFloat(data.discountValue),
        minPremium: data.minPremium ? parseFloat(data.minPremium) : 0,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        category: data.category || null,
        startDate,
        endDate,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'COUPON_CREATED',
      entityType: 'COUPON',
      entityId: coupon.id,
      req,
      newValue: coupon,
    });

    return coupon;
  }

  static async toggleCouponStatus(couponId, isActive, adminUser, req) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error('Coupon not found');

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'COUPON_STATUS_TOGGLED',
      entityType: 'COUPON',
      entityId: couponId,
      req,
      previousValue: { isActive: coupon.isActive },
      newValue: { isActive },
    });

    return updated;
  }

  /**
   * Real-time coupon validator for Proposal & Checkout flows
   */
  static async validateCoupon({ code, category = null, premiumAmount = 0 }) {
    if (!code) return { isValid: false, reason: 'Coupon code is required' };
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (!coupon) {
      return { isValid: false, reason: 'Invalid promotional code' };
    }

    if (!coupon.isActive) {
      return { isValid: false, reason: 'This promotional code is inactive' };
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return { isValid: false, reason: `This promotion starts on ${coupon.startDate.toLocaleDateString()}` };
    }
    if (now > coupon.endDate) {
      return { isValid: false, reason: 'This promotional code has expired' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, reason: 'This promotional code has reached its maximum redemption limit' };
    }

    const premium = parseFloat(premiumAmount) || 0;
    if (coupon.minPremium > 0 && premium < coupon.minPremium) {
      return {
        isValid: false,
        reason: `Minimum policy premium of $${coupon.minPremium.toLocaleString()} required for this coupon`,
      };
    }

    if (coupon.category && category && coupon.category !== category) {
      return {
        isValid: false,
        reason: `This coupon is valid only for ${coupon.category} insurance policies`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Number(((premium * coupon.discountValue) / 100).toFixed(2));
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, premium);
    }

    const finalPremium = Math.max(0, Number((premium - discountAmount).toFixed(2)));

    return {
      isValid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      originalPremium: premium,
      finalPremium,
      description: coupon.description,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5. INSURER PARTNER REGISTRY (SRS Section 20)
  // ─────────────────────────────────────────────────────────────
  static async listInsurers() {
    const insurers = await prisma.insurerPartner.findMany({
      orderBy: { name: 'asc' },
    });

    if (insurers.length === 0) {
      await this.seedDefaultInsurers();
      return prisma.insurerPartner.findMany({ orderBy: { name: 'asc' } });
    }

    // Attach active policy count from catalog
    const allPolicies = await prisma.insurancePolicy.findMany({
      select: { provider: true, isActive: true },
    });

    return insurers.map((ins) => {
      const related = allPolicies.filter((p) => p.provider.toLowerCase() === ins.name.toLowerCase());
      return {
        ...ins,
        totalPolicies: related.length,
        activePolicies: related.filter((p) => p.isActive).length,
      };
    });
  }

  static async createInsurer(data, adminUser, req) {
    const existing = await prisma.insurerPartner.findFirst({
      where: {
        OR: [{ name: data.name }, { irdaRegNo: data.irdaRegNo }],
      },
    });
    if (existing) throw new Error('Insurer name or IRDAI Registration Number already registered');

    const insurer = await prisma.insurerPartner.create({
      data: {
        name: data.name,
        irdaRegNo: data.irdaRegNo,
        category: data.category || 'HEALTH',
        commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : 0.125,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'INSURER_CREATED',
      entityType: 'INSURER',
      entityId: insurer.id,
      req,
      newValue: insurer,
    });

    return insurer;
  }

  static async toggleInsurerStatus(insurerId, isActive, adminUser, req) {
    const insurer = await prisma.insurerPartner.findUnique({ where: { id: insurerId } });
    if (!insurer) throw new Error('Insurer partner not found');

    const updated = await prisma.insurerPartner.update({
      where: { id: insurerId },
      data: { isActive },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'INSURER_STATUS_TOGGLED',
      entityType: 'INSURER',
      entityId: insurerId,
      req,
      previousValue: { isActive: insurer.isActive },
      newValue: { isActive },
    });

    return updated;
  }

  static async seedDefaultInsurers() {
    const defaults = [
      { name: 'Star Health Insurance', irdaRegNo: 'IRDAI/NL-GEN/007/2023', category: 'HEALTH', commissionRate: 0.15, contactEmail: 'partners@starhealth.in' },
      { name: 'HDFC Ergo', irdaRegNo: 'IRDAI/NL-GEN/146/2022', category: 'HEALTH', commissionRate: 0.14, contactEmail: 'corporate@hdfcergo.com' },
      { name: 'Max Bupa', irdaRegNo: 'IRDAI/NL-GEN/145/2023', category: 'HEALTH', commissionRate: 0.135, contactEmail: 'agency@nivabupa.com' },
      { name: 'ICICI Lombard', irdaRegNo: 'IRDAI/NL-GEN/115/2021', category: 'MOTOR', commissionRate: 0.12, contactEmail: 'partners@icicilombard.com' },
      { name: 'New India Assurance', irdaRegNo: 'IRDAI/NL-GEN/190/2020', category: 'MOTOR', commissionRate: 0.10, contactEmail: 'contact@newindia.co.in' },
    ];

    for (const d of defaults) {
      const exists = await prisma.insurerPartner.findUnique({ where: { name: d.name } });
      if (!exists) {
        await prisma.insurerPartner.create({ data: d });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. CMS & PLATFORM ANNOUNCEMENT BROADCASTER (SRS Section 20)
  // ─────────────────────────────────────────────────────────────
  static async listAnnouncements() {
    return prisma.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getActiveAnnouncement() {
    const now = new Date();
    return prisma.platformAnnouncement.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAnnouncement(data, adminUser, req) {
    const announcement = await prisma.platformAnnouncement.create({
      data: {
        title: data.title,
        message: data.message,
        severity: data.severity || 'INFO',
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'CMS',
      entityId: announcement.id,
      req,
      newValue: announcement,
    });

    return announcement;
  }

  static async toggleAnnouncement(id, isActive, adminUser, req) {
    const announcement = await prisma.platformAnnouncement.findUnique({ where: { id } });
    if (!announcement) throw new Error('Announcement not found');

    const updated = await prisma.platformAnnouncement.update({
      where: { id },
      data: { isActive },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'ANNOUNCEMENT_STATUS_TOGGLED',
      entityType: 'CMS',
      entityId: id,
      req,
      previousValue: { isActive: announcement.isActive },
      newValue: { isActive },
    });

    return updated;
  }

  static async deleteAnnouncement(id, adminUser, req) {
    const announcement = await prisma.platformAnnouncement.findUnique({ where: { id } });
    if (!announcement) throw new Error('Announcement not found');

    await prisma.platformAnnouncement.delete({ where: { id } });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'ANNOUNCEMENT_STATUS_TOGGLED',
      entityType: 'CMS',
      entityId: id,
      req,
      previousValue: announcement,
      newValue: { deleted: true },
    });

    return { message: 'Announcement deleted' };
  }

  // ─────────────────────────────────────────────────────────────
  // 7. PLATFORM OPERATIONAL SETTINGS & GOVERNANCE (SRS Section 20)
  // ─────────────────────────────────────────────────────────────
  static async ensureDefaultSettings() {
    const defaults = [
      {
        key: 'BROKERAGE_COMMISSION_RATE',
        value: 12.5,
        category: 'FINANCIAL',
        description: 'Standard platform brokerage commission percentage collected per policy sale',
      },
      {
        key: 'GATEWAY_FEE_RATE',
        value: 1.8,
        category: 'FINANCIAL',
        description: 'Estimated payment gateway transaction processing fee buffer percentage',
      },
      {
        key: 'AUTO_UNDERWRITING_THRESHOLD',
        value: 10000,
        category: 'UNDERWRITING',
        description: 'Maximum coverage value ($) eligible for instant algorithmic auto-approval without manual underwriter review',
      },
      {
        key: 'FRAUD_ALERT_THRESHOLD',
        value: 70,
        category: 'SECURITY',
        description: 'AI claim risk score threshold (0–100) above which claims are automatically flagged for forensic audit',
      },
      {
        key: 'MAINTENANCE_MODE',
        value: false,
        category: 'SYSTEM',
        description: 'Global maintenance toggle to temporarily suspend customer purchasing workflows during system maintenance',
      },
      {
        key: 'STRICT_KYC_MODE',
        value: true,
        category: 'SECURITY',
        description: 'Enforces mandatory verified PAN and Aadhaar identity before issuing final policy bonds',
      },
    ];

    for (const d of defaults) {
      const exists = await prisma.systemSetting.findUnique({ where: { key: d.key } });
      if (!exists) {
        await prisma.systemSetting.create({ data: d });
      }
    }
  }

  static async getSystemSettings() {
    await this.ensureDefaultSettings();
    return prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });
  }

  static async updateSystemSetting(key, value, adminUser, req) {
    const current = await prisma.systemSetting.findUnique({ where: { key } });
    if (!current) throw new Error(`Setting with key '${key}' not found`);

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        updatedBy: adminUser.email || adminUser.id,
      },
    });

    await this.recordAuditLog({
      userId: adminUser.id,
      action: 'SETTING_UPDATED',
      entityType: 'SETTING',
      entityId: key,
      req,
      previousValue: { [key]: current.value },
      newValue: { [key]: value },
    });

    return updated;
  }
}

module.exports = GovernanceService;

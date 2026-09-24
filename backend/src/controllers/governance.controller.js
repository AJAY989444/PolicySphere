const GovernanceService = require('../services/governance.service');

class GovernanceController {
  // 1. Overview
  static async getOverview(req, res, next) {
    try {
      const data = await GovernanceService.getGovernanceOverview();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 2. Audit Trail
  static async getAuditLogs(req, res, next) {
    try {
      const { page, limit, action, entityType, userId, search } = req.query;
      const data = await GovernanceService.getAuditLogs({
        page,
        limit,
        action,
        entityType,
        userId,
        search,
      });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 3. User & RBAC Administration
  static async getUsers(req, res, next) {
    try {
      const { page, limit, role, status, search } = req.query;
      const data = await GovernanceService.getUsersList({
        page,
        limit,
        role,
        status,
        search,
      });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await GovernanceService.updateUserRole(id, role, req.user, req);
      res.json({ success: true, message: `Role updated to ${role}`, user });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;
      const user = await GovernanceService.toggleUserStatus(id, isActive, reason, req.user, req);
      res.json({
        success: true,
        message: isActive ? 'User account activated' : 'User account suspended',
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  // 4. Coupons & Promotions
  static async listCoupons(req, res, next) {
    try {
      const coupons = await GovernanceService.listCoupons();
      res.json({ success: true, coupons });
    } catch (err) {
      next(err);
    }
  }

  static async createCoupon(req, res, next) {
    try {
      const coupon = await GovernanceService.createCoupon(req.body, req.user, req);
      res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
    } catch (err) {
      next(err);
    }
  }

  static async toggleCouponStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const coupon = await GovernanceService.toggleCouponStatus(id, isActive, req.user, req);
      res.json({ success: true, message: 'Coupon status updated', coupon });
    } catch (err) {
      next(err);
    }
  }

  static async validateCoupon(req, res, next) {
    try {
      const { code, category, premiumAmount } = req.body;
      const result = await GovernanceService.validateCoupon({ code, category, premiumAmount });
      if (!result.isValid) {
        return res.status(400).json({ success: false, ...result });
      }
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // 5. Insurer Partners
  static async listInsurers(req, res, next) {
    try {
      const insurers = await GovernanceService.listInsurers();
      res.json({ success: true, insurers });
    } catch (err) {
      next(err);
    }
  }

  static async createInsurer(req, res, next) {
    try {
      const insurer = await GovernanceService.createInsurer(req.body, req.user, req);
      res.status(201).json({ success: true, message: 'Insurer partner registered', insurer });
    } catch (err) {
      next(err);
    }
  }

  static async toggleInsurerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const insurer = await GovernanceService.toggleInsurerStatus(id, isActive, req.user, req);
      res.json({ success: true, message: 'Insurer partner status updated', insurer });
    } catch (err) {
      next(err);
    }
  }

  // 6. CMS Announcements
  static async listAnnouncements(req, res, next) {
    try {
      const announcements = await GovernanceService.listAnnouncements();
      res.json({ success: true, announcements });
    } catch (err) {
      next(err);
    }
  }

  static async getActiveAnnouncement(req, res, next) {
    try {
      const announcement = await GovernanceService.getActiveAnnouncement();
      res.json({ success: true, announcement });
    } catch (err) {
      next(err);
    }
  }

  static async createAnnouncement(req, res, next) {
    try {
      const announcement = await GovernanceService.createAnnouncement(req.body, req.user, req);
      res.status(201).json({ success: true, message: 'Announcement broadcasted', announcement });
    } catch (err) {
      next(err);
    }
  }

  static async toggleAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const announcement = await GovernanceService.toggleAnnouncement(id, isActive, req.user, req);
      res.json({ success: true, message: 'Announcement status updated', announcement });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const result = await GovernanceService.deleteAnnouncement(id, req.user, req);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // 7. System Settings
  static async getSettings(req, res, next) {
    try {
      const settings = await GovernanceService.getSystemSettings();
      res.json({ success: true, settings });
    } catch (err) {
      next(err);
    }
  }

  static async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await GovernanceService.updateSystemSetting(key, value, req.user, req);
      res.json({ success: true, message: `Setting '${key}' updated`, setting });
    } catch (err) {
      next(err);
    }
  }

  // 8. Disaster Recovery & High Availability (SRS Module 31)
  static async getDrStatus(req, res, next) {
    try {
      const DrBackupService = require('../services/drBackup.service');
      const status = await DrBackupService.getDrHealthStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  static async triggerDrBackup(req, res, next) {
    try {
      const DrBackupService = require('../services/drBackup.service');
      const snapshot = await DrBackupService.createBackupSnapshot('MANUAL_ADMIN_TRIGGER');
      res.json({ success: true, data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async simulateDrRehearsal(req, res, next) {
    try {
      const DrBackupService = require('../services/drBackup.service');
      const { snapshotId } = req.body;
      const rehearsal = await DrBackupService.simulateRestoreRehearsal(snapshotId);
      res.json({ success: true, data: rehearsal });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GovernanceController;

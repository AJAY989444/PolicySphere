const fs = require('fs');
const path = require('path');

// File-backed store for KYC Document Verification requests to persist across server restarts
const STORAGE_FILE = path.join(__dirname, '../../kyc_store.json');
const kycRequestsStore = new Map();

// Load stored KYC requests from JSON file
const loadKycStore = () => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      Object.entries(data).forEach(([key, val]) => {
        kycRequestsStore.set(key, val);
      });
    }
  } catch (err) {
    console.error('Failed to load kyc_store.json:', err.message);
  }
};

// Save KYC store to JSON file
const saveKycStore = () => {
  try {
    const obj = {};
    kycRequestsStore.forEach((value, key) => {
      obj[key] = value;
    });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save kyc_store.json:', err.message);
  }
};

loadKycStore();

// Helper to seed standard initial pending KYC requests if empty
const seedInitialKycRequests = () => {
  if (kycRequestsStore.size === 0) {
    const demoRequests = [
      {
        id: 'kyc-1',
        userId: 'user-john-doe',
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        documentType: 'PAN',
        documentNumber: 'ABCDE1234F',
        fileUrl: '/uploads/claims/sample-pan.jpg',
        fileName: 'pan_card_john.jpg',
        submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'PENDING_REVIEW', // PENDING_REVIEW, VERIFIED, REJECTED
        notes: 'Submitted for health policy purchase'
      },
      {
        id: 'kyc-2',
        userId: 'user-sarah-smith',
        userName: 'Sarah Smith',
        userEmail: 'sarah.smith@example.com',
        documentType: 'AADHAAR',
        documentNumber: '9876-5432-1098',
        fileUrl: '/uploads/claims/sample-aadhaar.jpg',
        fileName: 'aadhaar_front_back.pdf',
        submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'PENDING_REVIEW',
        notes: 'Submitted for auto policy claim'
      }
    ];
    demoRequests.forEach(req => kycRequestsStore.set(req.id, req));
    saveKycStore();
  }
};

seedInitialKycRequests();

const submitKycDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const userName = `${req.user?.firstName || 'Customer'} ${req.user?.lastName || ''}`.trim();
    const userEmail = (req.user?.email || 'customer@policysphere.com').toLowerCase();
    const { documentType, documentNumber } = req.body;
    const file = req.file;

    if (!file && !documentNumber) {
      return res.status(400).json({ error: 'Document file and ID number are required.' });
    }

    const fileUrl = file ? `/uploads/claims/${file.filename}` : '/uploads/claims/sample-doc.jpg';
    const fileName = file ? file.originalname : 'customer_id.jpg';
    const docId = 'kyc-' + Date.now();

    const newKycRecord = {
      id: docId,
      userId,
      userName,
      userEmail,
      documentType: (documentType || 'PAN').toUpperCase(),
      documentNumber: documentNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      fileUrl,
      fileName,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REVIEW',
      notes: 'Awaiting Advisor Manual Verification'
    };

    kycRequestsStore.set(docId, newKycRecord);
    // Save lookup by both ID and Email
    kycRequestsStore.set(`user_${userId}`, newKycRecord);
    kycRequestsStore.set(`email_${userEmail}`, newKycRecord);

    saveKycStore();

    return res.json({
      message: 'KYC Document submitted successfully for Advisor verification.',
      kyc: newKycRecord
    });
  } catch (error) {
    next(error);
  }
};

const getMyKycStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const userEmail = (req.user?.email || '').toLowerCase();
    
    // Lookup by user ID or user Email
    let kycRecord = kycRequestsStore.get(`user_${userId}`) || (userEmail ? kycRequestsStore.get(`email_${userEmail}`) : null);

    if (!kycRecord) {
      return res.json({
        isSubmitted: false,
        status: 'NOT_SUBMITTED',
        message: 'No KYC document submitted yet.'
      });
    }

    return res.json({
      isSubmitted: true,
      kyc: kycRecord
    });
  } catch (error) {
    next(error);
  }
};

// Advisor API Endpoints
const getAllPendingKyc = async (req, res, next) => {
  try {
    loadKycStore();
    seedInitialKycRequests();
    // Return unique items filtering out user_ and email_ alias keys
    const recordsMap = new Map();
    Array.from(kycRequestsStore.values()).forEach(item => {
      if (item && item.id && item.id.startsWith('kyc-')) {
        recordsMap.set(item.id, item);
      }
    });
    return res.json({ kycList: Array.from(recordsMap.values()) });
  } catch (error) {
    next(error);
  }
};

const NotificationService = require('../services/notification.service');

const reviewKycDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // VERIFIED or REJECTED

    const record = kycRequestsStore.get(id);
    if (!record) {
      return res.status(404).json({ error: 'KYC Record not found' });
    }

    record.status = status;
    record.notes = notes || (status === 'VERIFIED' ? 'Approved by Advisor' : 'Rejected by Advisor');
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = req.user?.email || 'Advisor';

    kycRequestsStore.set(id, record);
    if (record.userId) {
      kycRequestsStore.set(`user_${record.userId}`, record);
    }
    if (record.userEmail) {
      kycRequestsStore.set(`email_${record.userEmail.toLowerCase()}`, record);
    }

    saveKycStore();

    if (record.userId && !record.userId.startsWith('user-')) {
      // Create notification for the user bell icon
      await NotificationService.createNotification({
        userId: record.userId,
        title: status === 'VERIFIED' ? '🎉 KYC Verification Approved!' : '⚠️ KYC Verification Update',
        message: status === 'VERIFIED'
          ? `Your ${record.documentType} card verification has been approved by an Advisor.`
          : `Your ${record.documentType} card verification was rejected. Reason: ${record.notes}`,
        type: status === 'VERIFIED' ? 'CLAIM_UPDATE' : 'SYSTEM',
        linkUrl: '/profile'
      });
    }

    return res.json({
      message: `KYC document marked as ${status}`,
      kyc: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKycDocument,
  getMyKycStatus,
  getAllPendingKyc,
  reviewKycDocument
};

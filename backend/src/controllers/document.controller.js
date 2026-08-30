// Global store for KYC Document Verification requests (in-memory for demo / easily extensible to DB)
const kycRequestsStore = new Map();

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
  }
};

seedInitialKycRequests();

const submitKycDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const userName = `${req.user?.firstName || 'Customer'} ${req.user?.lastName || ''}`.trim();
    const userEmail = req.user?.email || 'customer@policysphere.com';
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
    // Also save under user ID lookup
    kycRequestsStore.set(`user_${userId}`, newKycRecord);

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
    const kycRecord = kycRequestsStore.get(`user_${userId}`);

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
    seedInitialKycRequests();
    // Return unique items filtering out user_ alias keys
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

      // Create notification for the user bell icon
      if (!record.userId.startsWith('user-')) {
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

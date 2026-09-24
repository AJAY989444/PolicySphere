const express = require('express');
const router = express.Router();
const IntegrationsController = require('../controllers/integrations.controller');

// DigiLocker Document Fetch
router.get('/digilocker/documents', IntegrationsController.getDigiLockerDocs);

// NSDL PAN Verification
router.post('/nsdl/pan-verify', IntegrationsController.verifyPan);

// UIDAI Aadhaar eKYC OTP Generation & Authentication
router.post('/uidai/aadhaar-otp', IntegrationsController.generateAadhaarOtp);
router.post('/uidai/aadhaar-verify', IntegrationsController.verifyAadhaarOtp);

// CKYC Central Registry Lookup
router.post('/ckyc/lookup', IntegrationsController.lookupCkyc);

// Cashless Hospital Network Locator
router.get('/hospitals', IntegrationsController.searchHospitals);
router.post('/hospitals/:id/preauth-check', IntegrationsController.checkCashlessPreAuthEligibility);

module.exports = router;

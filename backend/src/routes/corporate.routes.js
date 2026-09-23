const { Router } = require('express');
const CorporateController = require('../controllers/corporate.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = Router();

// Overview & Analytics (accessible with optionalAuth so demo data loads reliably)
router.get('/overview', optionalAuth, CorporateController.getOverview);

// Employee Census & Roster
router.get('/employees', optionalAuth, CorporateController.listEmployees);
router.post('/employees', optionalAuth, CorporateController.addEmployee);
router.post('/employees/bulk', optionalAuth, CorporateController.bulkUploadEmployees);
router.put('/employees/:id/status', optionalAuth, CorporateController.updateEmployeeStatus);

// Dependents
router.post('/employees/:id/dependents', optionalAuth, CorporateController.addDependent);
router.delete('/dependents/:dependentId', optionalAuth, CorporateController.deleteDependent);

// Digital e-Health Cards
router.get('/ecard/:employeeId', optionalAuth, CorporateController.getDigitalECard);

// Group Policies
router.get('/policies', optionalAuth, CorporateController.listGroupPolicies);
router.post('/policies', optionalAuth, CorporateController.createGroupPolicy);

// Corporate Claims Radar
router.get('/claims', optionalAuth, CorporateController.listClaims);
router.post('/claims', optionalAuth, CorporateController.submitClaim);
router.put('/claims/:id/status', optionalAuth, CorporateController.updateClaimStatus);

// Monthly PEPM Billing & Invoices
router.get('/invoices', optionalAuth, CorporateController.listInvoices);
router.post('/invoices/generate', optionalAuth, CorporateController.generateMonthlyInvoice);

// Employee Self-Service
router.get('/my-benefits', optionalAuth, CorporateController.getMyBenefits);

module.exports = router;

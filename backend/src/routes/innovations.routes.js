// backend/src/routes/innovations.routes.js
const express = require('express');
const router = express.Router();
const InnovationsController = require('../controllers/innovations.controller');

// Module 32: Telematics & PHYD
router.post('/telematics/evaluate', InnovationsController.evaluateTelematics);

// Module 32: IoT Wearables Health Sync
router.post('/wearables/sync', InnovationsController.syncWearables);

// Module 32: Embedded Insurance SDK
router.post('/embedded/quote', InnovationsController.quoteEmbedded);
router.post('/embedded/bind', InnovationsController.bindEmbedded);

// Module 38: Unit Economics & CLV
router.get('/actuarial/unit-economics', InnovationsController.getUnitEconomics);

// Module 37: i18n Localization
router.get('/i18n/locales', InnovationsController.getSupportedLocales);
router.get('/i18n/translations/:lang', InnovationsController.getTranslations);

module.exports = router;

// backend/src/controllers/innovations.controller.js
// Controller for Modules 32, 37, 38 (Telematics, Wearables, Embedded SDK, i18n, Actuarial Unit Economics)

const InnovationsService = require('../services/innovations.service');
const ActuarialEconomicsService = require('../services/actuarialEconomics.service');
const I18nService = require('../services/i18n.service');

class InnovationsController {
  // ─── Module 32: Telematics & PHYD ───
  static evaluateTelematics(req, res, next) {
    try {
      const result = InnovationsService.evaluateTelematicsTrip(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ─── Module 32: Wearable Health Sync ───
  static syncWearables(req, res, next) {
    try {
      const result = InnovationsService.ingestWearableData(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ─── Module 32: Embedded Insurance SDK ───
  static quoteEmbedded(req, res, next) {
    try {
      const quote = InnovationsService.createEmbeddedQuote(req.body);
      res.json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  }

  static bindEmbedded(req, res, next) {
    try {
      const { quoteToken, customerDetails = {} } = req.body;
      if (!quoteToken) {
        return res.status(400).json({ success: false, message: 'Quote token is required' });
      }
      const policy = InnovationsService.bindEmbeddedPolicy(quoteToken, customerDetails);
      res.json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }

  // ─── Module 38: Unit Economics & CLV ───
  static async getUnitEconomics(req, res, next) {
    try {
      const economics = await ActuarialEconomicsService.getPortfolioUnitEconomics();
      res.json({ success: true, data: economics });
    } catch (err) {
      next(err);
    }
  }

  // ─── Module 37: i18n Localization ───
  static getTranslations(req, res, next) {
    try {
      const { lang = 'en' } = req.params;
      const translations = I18nService.getTranslations(lang);
      res.json({ success: true, lang, translations });
    } catch (err) {
      next(err);
    }
  }

  static getSupportedLocales(req, res, next) {
    try {
      const locales = I18nService.getSupportedLocales();
      res.json({ success: true, locales });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InnovationsController;

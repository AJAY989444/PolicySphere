const AIService = require('../services/ai.service');

class AIController {
  static async chat(req, res, next) {
    try {
      const { message, conversationHistory } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      const result = await AIService.processChatQuery(message, conversationHistory);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;

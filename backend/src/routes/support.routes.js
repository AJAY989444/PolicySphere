const express = require('express');
const router = express.Router();
const SupportController = require('../controllers/support.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// ─── Public / Open Routes ──────────────────────────────────
// Knowledge Base
router.get('/kb', SupportController.searchKnowledgeBase);
router.get('/kb/:slug', SupportController.getArticleBySlug);
router.post('/kb/:slug/vote', optionalAuth, SupportController.voteArticle);

// Live Chat & Voice Callbacks (Guest or Logged in)
router.post('/chat/start', optionalAuth, SupportController.startLiveChat);
router.post('/chat/:sessionRef/message', SupportController.sendChatMessage);
router.post('/callback', optionalAuth, SupportController.requestVoiceCallback);
router.post('/whatsapp/simulate', optionalAuth, SupportController.simulateWhatsApp);

// ─── Customer Authenticated Routes ─────────────────────────
router.post('/tickets', requireAuth, SupportController.createTicket);
router.get('/tickets/my', requireAuth, SupportController.getMyTickets);
router.get('/tickets/:id', requireAuth, SupportController.getTicketDetails);
router.post('/tickets/:id/messages', requireAuth, SupportController.addMessage);
router.post('/tickets/:id/csat', requireAuth, SupportController.rateCSAT);

// ─── Staff & Admin Desk Routes ─────────────────────────────
router.get(
  '/desk/tickets',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.getStaffTickets
);
router.patch(
  '/tickets/:id/status',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.updateStatus
);
router.patch(
  '/tickets/:id/escalate',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.escalateTicket
);
router.patch(
  '/tickets/:id/reassign',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.reassignTicket
);
router.post(
  '/desk/sla-sweep',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.checkSlaBreaches
);
router.get(
  '/desk/analytics',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.getAnalytics
);
router.get(
  '/callbacks',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.getVoiceCallbacks
);
router.patch(
  '/callbacks/:id',
  requireAuth,
  roleGuard(['ADVISOR', 'ADMIN']),
  SupportController.updateCallbackStatus
);

module.exports = router;

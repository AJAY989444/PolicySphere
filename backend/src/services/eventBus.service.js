const EventEmitter = require('events');
const webSocketService = require('./websocket.service');

/**
 * Domain Event Bus (SRS Section 24 - Event Driven Microservices)
 * Decoupled event propagation across modules and real-time push to WebSockets.
 */

class EventBusService extends EventEmitter {
  constructor() {
    super();
    this.history = [];
    this.maxHistory = 100;

    // Automatically bridge domain events to WebSocket channels
    this.setupWebSocketBridges();
  }

  emitDomainEvent(eventName, payload) {
    const eventObject = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      eventName,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Keep history ring buffer
    this.history.unshift(eventObject);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Trigger internal EventEmitter listeners
    this.emit(eventName, eventObject);
    this.emit('*', eventObject);

    return eventObject;
  }

  setupWebSocketBridges() {
    this.on('*', (event) => {
      // Forward to global broadcast channel
      webSocketService.broadcastToChannel('channel:broadcast', {
        type: 'DOMAIN_EVENT',
        event: event.eventName,
        data: event.payload,
        timestamp: event.timestamp,
      });

      // Forward to specific topic channels
      if (event.eventName.startsWith('CLAIM_')) {
        webSocketService.broadcastToChannel('channel:claims', {
          type: event.eventName,
          data: event.payload,
        });
      }

      if (event.eventName.startsWith('LEAD_') || event.eventName.startsWith('CRM_')) {
        webSocketService.broadcastToChannel('channel:crm', {
          type: event.eventName,
          data: event.payload,
        });
      }

      if (event.eventName.startsWith('PERFORMANCE_')) {
        webSocketService.broadcastToChannel('channel:performance', {
          type: event.eventName,
          data: event.payload,
        });
      }

      // If payload contains userId, route directly to that user's private channel
      if (event.payload?.userId) {
        webSocketService.sendToUser(event.payload.userId, {
          type: event.eventName,
          data: event.payload,
        });
      }
    });
  }

  getRecentEvents(limit = 20) {
    return this.history.slice(0, limit);
  }
}

const eventBusService = new EventBusService();
module.exports = eventBusService;

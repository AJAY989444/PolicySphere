const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, userId, role, channels: Set }
    this.totalConnectionsHandled = 0;
  }

  /**
   * Attach WebSocket server to the existing HTTP server instance
   */
  init(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    console.log('⚡ WebSocket Real-Time Gateway initialized on path /ws');

    this.wss.on('connection', (ws, req) => {
      const clientId = 'ws_' + Math.random().toString(36).substring(2, 10);
      this.totalConnectionsHandled++;

      const clientInfo = {
        ws,
        clientId,
        userId: null,
        role: 'GUEST',
        connectedAt: new Date().toISOString(),
        channels: new Set(['channel:broadcast', 'channel:performance']),
      };

      this.clients.set(clientId, clientInfo);

      // Welcome handshake packet
      ws.send(JSON.stringify({
        type: 'SYSTEM_WELCOME',
        clientId,
        serverTime: new Date().toISOString(),
        message: 'Connected to PolicySphere Real-Time Gateway (SRS Module 23)',
        subscribedChannels: Array.from(clientInfo.channels),
      }));

      ws.on('message', (message) => {
        try {
          const payload = JSON.parse(message.toString());
          this.handleClientMessage(clientId, payload);
        } catch (err) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Invalid JSON payload received',
            error: err.message,
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', (err) => {
        console.warn(`[WebSocket] Client error (${clientId}):`, err.message);
        this.clients.delete(clientId);
      });
    });

    // Start background heartbeat ping every 30s
    this.startHeartbeat();
  }

  /**
   * Handle incoming messages from connected clients
   */
  handleClientMessage(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (payload.action) {
      case 'PING':
        client.ws.send(JSON.stringify({
          type: 'PONG',
          clientTime: payload.timestamp,
          serverTime: new Date().toISOString(),
          activeConnections: this.clients.size,
        }));
        break;

      case 'AUTH':
        if (payload.userId) {
          client.userId = payload.userId;
          client.role = payload.role || 'CUSTOMER';
          client.channels.add(`user:${payload.userId}`);
          client.ws.send(JSON.stringify({
            type: 'AUTH_SUCCESS',
            userId: client.userId,
            role: client.role,
            channels: Array.from(client.channels),
          }));
        }
        break;

      case 'SUBSCRIBE':
        if (payload.channel) {
          client.channels.add(payload.channel);
          client.ws.send(JSON.stringify({
            type: 'SUBSCRIBED',
            channel: payload.channel,
            allSubscribed: Array.from(client.channels),
          }));
        }
        break;

      case 'UNSUBSCRIBE':
        if (payload.channel) {
          client.channels.delete(payload.channel);
          client.ws.send(JSON.stringify({
            type: 'UNSUBSCRIBED',
            channel: payload.channel,
          }));
        }
        break;

      case 'SIMULATE_EVENT':
        // Test harness allowing clients to simulate domain broadcast
        this.broadcastToChannel(payload.channel || 'channel:broadcast', {
          type: payload.eventType || 'TEST_EVENT',
          sender: clientId,
          data: payload.data || { note: 'Live simulation event' },
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        client.ws.send(JSON.stringify({
          type: 'ECHO',
          received: payload,
          timestamp: new Date().toISOString(),
        }));
    }
  }

  /**
   * Broadcast a payload to all clients subscribed to a specific channel
   */
  broadcastToChannel(channel, payload) {
    if (!this.wss) return;

    const messageString = JSON.stringify({
      channel,
      ...payload,
      broadcastAt: new Date().toISOString(),
    });

    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageString);
        sentCount++;
      }
    });

    return sentCount;
  }

  /**
   * Send a targeted real-time message to a specific user ID
   */
  sendToUser(userId, payload) {
    return this.broadcastToChannel(`user:${userId}`, payload);
  }

  /**
   * Real-time metrics
   */
  getConnectedStats() {
    return {
      activeConnections: this.clients.size,
      totalHandled: this.totalConnectionsHandled,
      channelsActive: Array.from(new Set(
        Array.from(this.clients.values()).flatMap((c) => Array.from(c.channels))
      )),
    };
  }

  startHeartbeat() {
    setInterval(() => {
      if (!this.wss) return;
      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        } else {
          this.clients.delete(clientId);
        }
      });
    }, 30000);
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
module.exports = webSocketService;

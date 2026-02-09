/**
 * WebSocket Server for Real-time Data Synchronization
 * Handles WebSocket connections and broadcasts updates to clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { getVaultSecrets } from './vault-secrets';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;
const clients = new Map<string, Set<WebSocketClient>>();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server: any) {
  if (wss) {
    console.log('[WebSocket] Server already initialized');
    return wss;
  }

  wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('[WebSocket] New connection attempt');

    // Extract token from query string or Authorization header
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[WebSocket] No token provided, closing connection');
      ws.close(1008, 'Unauthorized: Token required');
      return;
    }

    // Verify JWT token
    try {
      const secrets = getVaultSecrets();
      const jwtSecret = secrets.jwt.secret;

      if (!jwtSecret) {
        console.error('[WebSocket] JWT secret not found');
        ws.close(1011, 'Internal server error');
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
      ws.userId = decoded.userId;
      ws.isAlive = true;

      // Add to clients map
      if (!clients.has(decoded.userId)) {
        clients.set(decoded.userId, new Set());
      }
      clients.get(decoded.userId)!.add(ws);

      console.log(`[WebSocket] Client connected: ${decoded.userId} (${decoded.email})`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: decoded.userId,
      }));

      // Handle ping/pong for keepalive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('[WebSocket] Message from client:', data);
          
          // Handle different message types
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${decoded.userId}`);
        const userClients = clients.get(decoded.userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            clients.delete(decoded.userId);
          }
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for user ${decoded.userId}:`, error);
      });

    } catch (error) {
      console.error('[WebSocket] Token verification failed:', error);
      ws.close(1008, 'Unauthorized: Invalid token');
    }
  });

  // Ping clients every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    wss?.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating inactive connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log('[WebSocket] Server initialized on /ws');
  return wss;
}

/**
 * Broadcast message to all clients of a specific user
 */
export function broadcastToUser(userId: string, message: any) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    return;
  }

  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  let errorCount = 0;

  userClients.forEach((ws: WebSocketClient) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error(`[WebSocket] Error sending to user ${userId}:`, error);
        errorCount++;
      }
    }
  });

  if (sentCount > 0) {
    console.log(`[WebSocket] Broadcasted to ${sentCount} client(s) for user ${userId}`);
  }
  if (errorCount > 0) {
    console.warn(`[WebSocket] Failed to send to ${errorCount} client(s) for user ${userId}`);
  }
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastToAll(message: any) {
  if (!wss) return;

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  wss.clients.forEach((ws: WebSocketClient) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error('[WebSocket] Error broadcasting:', error);
      }
    }
  });

  console.log(`[WebSocket] Broadcasted to ${sentCount} client(s)`);
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer() {
  return wss;
}

/**
 * Get connected clients count for a user
 */
export function getClientCount(userId: string): number {
  return clients.get(userId)?.size || 0;
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer() {
  if (wss) {
    wss.close();
    wss = null;
    clients.clear();
    console.log('[WebSocket] Server closed');
  }
}

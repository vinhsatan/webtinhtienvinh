/**
 * Server Sync Utility
 * Syncs data from server API and receives real-time updates via SSE
 */

let eventSource = null;
let syncCallbacks = new Map();
let isConnected = false;
let sseRetryCount = 0;
const SSE_MAX_RETRIES = 5;

/**
 * Initialize server sync with SSE connection
 * Pre-checks token validity; on 401, calls onAuthFailed and does not start
 * VITE_NO_SERVER_SYNC=true: Không kết nối server (chỉ dùng localStorage khi npm run dev)
 */
export function startServerSync(token, callbacks = {}) {
  if (import.meta.env.VITE_NO_SERVER_SYNC === 'true') {
    console.log('[ServerSync] VITE_NO_SERVER_SYNC=true - skip server sync');
    return;
  }
  if (!token) {
    console.error('[ServerSync] Token is required');
    return;
  }
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!storedToken) {
    console.warn('[ServerSync] No token in storage. Not starting (user may have logged out).');
    return;
  }

  Object.entries(callbacks).forEach(([key, callback]) => {
    syncCallbacks.set(key, callback);
  });

  stopServerSync();
  sseRetryCount = 0;

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  // For production (https), use hostname without port
  // For dev (http), use full host with port
  const host = window.location.protocol === 'https:' 
    ? window.location.hostname 
    : window.location.host;
  fetch(`${protocol}//${host}/api/products?limit=1`, {
    headers: { 'Authorization': `Bearer ${storedToken}` },
  }).then(res => {
    if (res.status === 401) {
      console.warn('[ServerSync] Token invalid (401), not starting SSE');
      if (syncCallbacks.has('onAuthFailed')) {
        syncCallbacks.get('onAuthFailed')();
      }
      return;
    }
    doStartSSE(storedToken, protocol, host);
  }).catch(() => {
    if (!localStorage.getItem('auth_token')) return;
    doStartSSE(storedToken, protocol, host);
  });
}

function doStartSSE(token, protocol, host) {
  const sseUrl = `${protocol}//${host}/api/events?token=${encodeURIComponent(token)}`;

  try {
    eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('[ServerSync] SSE connection opened');
      isConnected = true;
      if (syncCallbacks.has('onConnect')) {
        syncCallbacks.get('onConnect')();
      }
    };

    eventSource.onmessage = (event) => {
      try {
        let dataStr = event.data;
        if (dataStr.startsWith('data: ')) {
          dataStr = dataStr.substring(6);
        }
        const data = JSON.parse(dataStr);
        handleServerMessage(data);
      } catch (error) {
        console.error('[ServerSync] Error parsing message:', error, event.data);
      }
    };

    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('[ServerSync] Error parsing connected event:', error);
      }
    });

    eventSource.addEventListener('ping', () => {});

    eventSource.onerror = () => {
      isConnected = false;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (syncCallbacks.has('onError')) {
        syncCallbacks.get('onError')();
      }
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!storedToken) {
        console.warn('[ServerSync] No token in storage. Stopping reconnection loop.');
        if (syncCallbacks.has('onAuthFailed')) {
          syncCallbacks.get('onAuthFailed')();
        }
        return;
      }
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const host = window.location.host;
      fetch(`${protocol}//${host}/api/products?limit=1`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (res.status === 401) {
            console.error('[ServerSync] Authentication failed (401). Stopping sync.');
            if (syncCallbacks.has('onAuthFailed')) {
              syncCallbacks.get('onAuthFailed')();
            }
            return;
          }
          sseRetryCount += 1;
          if (sseRetryCount >= SSE_MAX_RETRIES) {
            console.log('[ServerSync] Max retries reached, stopping.');
            if (syncCallbacks.has('onAuthFailed')) {
              syncCallbacks.get('onAuthFailed')();
            }
            return;
          }
          setTimeout(() => {
            if (!localStorage.getItem('auth_token')) return;
            if (!isConnected) {
              startServerSync(localStorage.getItem('auth_token'), Object.fromEntries(syncCallbacks));
            }
          }, 5000);
        })
        .catch(() => {
          sseRetryCount += 1;
          if (sseRetryCount >= SSE_MAX_RETRIES) {
            if (syncCallbacks.has('onAuthFailed')) {
              syncCallbacks.get('onAuthFailed')();
            }
            return;
          }
          setTimeout(() => {
            if (!localStorage.getItem('auth_token')) return;
            if (!isConnected) {
              startServerSync(localStorage.getItem('auth_token'), Object.fromEntries(syncCallbacks));
            }
          }, 5000);
        });
    };

    console.log('[ServerSync] Started SSE connection');
  } catch (error) {
    console.error('[ServerSync] Failed to start SSE:', error);
    isConnected = false;
  }
}

/**
 * Stop server sync
 */
export function stopServerSync() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  isConnected = false;
  syncCallbacks.clear();
  console.log('[ServerSync] Stopped');
}

/**
 * Handle messages from server
 */
function handleServerMessage(data) {
  let type, payload;

  if (data.type) {
    type = data.type;
    payload = data.data || data;
  } else if (data.event) {
    type = data.event;
    payload = data.data || data;
  } else {
    type = data.type || 'unknown';
    payload = data;
  }

  switch (type) {
    case 'connected':
      console.log('[ServerSync] Connected to server');
      break;
    case 'ping':
      break;
    case 'product_added':
    case 'product_updated':
    case 'product_deleted':
      if (syncCallbacks.has('onProductUpdate')) {
        syncCallbacks.get('onProductUpdate')(type, payload);
      }
      break;
    case 'transaction_added':
    case 'transaction_updated':
    case 'transaction_deleted':
      if (syncCallbacks.has('onTransactionUpdate')) {
        syncCallbacks.get('onTransactionUpdate')(type, payload);
      }
      break;
    case 'order_added':
    case 'order_updated':
    case 'order_deleted':
      if (syncCallbacks.has('onOrderUpdate')) {
        syncCallbacks.get('onOrderUpdate')(type, payload);
      }
      break;
    case 'customer_added':
    case 'customer_updated':
    case 'customer_deleted':
      if (syncCallbacks.has('onCustomerUpdate')) {
        syncCallbacks.get('onCustomerUpdate')(type, payload);
      }
      break;
    default:
      console.log('[ServerSync] Unknown message type:', type);
  }
}

/**
 * Fetch data from server API
 */
export async function fetchFromServer(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token');
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.host;
  const url = `${protocol}//${host}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    const text = await response.text();
    try {
      const err = JSON.parse(text);
      throw new Error(err.error || `HTTP ${response.status}`);
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      throw new Error(text?.slice(0, 100) || `HTTP ${response.status}`);
    }
  }

  const text = await response.text();
  if (!text || text.trim().startsWith('<')) {
    throw new Error('Server returned HTML instead of JSON');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON response');
  }
}

function normalizeProduct(row) {
  if (!row) return null;
  return {
    ...row,
    name: row.name ?? row.productName ?? '',
    wholesalePrice: row.wholesale_price ?? row.wholesalePrice,
    tiktokPrice: row.tiktok_price ?? row.tiktokPrice,
    shopeePrice: row.shopee_price ?? row.shopeePrice,
  };
}

export async function syncProducts() {
  try {
    const result = await fetchFromServer('/api/products');
    const rows = result.data || [];
    return rows.map(normalizeProduct).filter(Boolean);
  } catch (error) {
    console.error('[ServerSync] Error syncing products:', error);
    return [];
  }
}

export async function syncTransactions() {
  try {
    const result = await fetchFromServer('/api/transactions');
    return result.data || [];
  } catch (error) {
    console.error('[ServerSync] Error syncing transactions:', error);
    return [];
  }
}

export async function syncOrders() {
  try {
    const result = await fetchFromServer('/api/orders');
    return result.data || [];
  } catch (error) {
    console.error('[ServerSync] Error syncing orders:', error);
    return [];
  }
}

export async function syncCustomers() {
  try {
    const result = await fetchFromServer('/api/customers');
    return result.data || [];
  } catch (error) {
    console.error('[ServerSync] Error syncing customers:', error);
    return [];
  }
}

export async function syncWallets() {
  try {
    const result = await fetchFromServer('/api/wallets');
    return result.data || { cash: 0, bank: 0 };
  } catch (error) {
    console.error('[ServerSync] Error syncing wallets:', error);
    return null;
  }
}

export async function syncCategories() {
  try {
    const result = await fetchFromServer('/api/categories');
    const data = result.data || { income: [], expense: [] };
    if (!Array.isArray(data.nhap)) {
      data.nhap = [];
    }
    return data;
  } catch (error) {
    console.error('[ServerSync] Error syncing categories:', error);
    return null;
  }
}

export async function syncTemplates() {
  try {
    const result = await fetchFromServer('/api/templates');
    return result.data || [];
  } catch (error) {
    console.error('[ServerSync] Error syncing templates:', error);
    return [];
  }
}

export function isServerConnected() {
  return isConnected;
}

/**
 * API Sync Utility
 * Wraps localStorage functions to automatically sync with server API
 */

import * as ls from './localStorage';
const {
  addProduct: localStorageAddProduct,
  updateProduct: localStorageUpdateProduct,
  deleteProduct: localStorageDeleteProduct,
  getProducts: localStorageGetProducts,
  getTransactions: localStorageGetTransactions,
  addTransaction: localStorageAddTransaction,
  updateTransaction: localStorageUpdateTransaction,
  deleteTransaction: localStorageDeleteTransaction,
  getOrders,
  getCustomers,
  getWallets,
  getCategories: localStorageGetCategories,
  getTemplates,
  getDebts,
  initializeStorage,
  updateWallets,
  addOrder,
  addCategory: localStorageAddCategory,
  deleteCategory: localStorageDeleteCategory,
  addTemplate,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addDebt,
  updateDebt,
  deleteDebt,
} = ls;
// Import helper functions from localStorage (they're not exported, need to access via module)
// We'll use localStorage directly for these operations
// Phải khớp với localStorage.js - server có thể trả về user.id hoặc user.userId
const getStorageKey = (baseKey) => {
  if (typeof window === "undefined") return baseKey;
  try {
    const savedUser = window.localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const userId = user?.id ?? user?.userId ?? null;
      if (userId) {
        return `${baseKey}_user_${userId}`;
      }
    }
  } catch (error) {
    console.error('Error getting storage key:', error);
  }
  return baseKey;
};

const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const savedUser = window.localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user?.id ?? user?.userId ?? null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
};

// Find a product by either its local id or serverId (if stored)
const findProductByAnyId = (id) => {
  const products = localStorageGetProducts();
  const idStr = id != null ? String(id) : null;
  return (
    products.find((p) => idStr && String(p.id) === idStr) ||
    products.find((p) => idStr && p.serverId && String(p.serverId) === idStr)
  );
};

const STORAGE_KEYS = {
  TRANSACTIONS: "finmaster_transactions",
  WALLETS: "finmaster_wallets",
  ORDERS: "finmaster_orders",
  DEBTS: "finmaster_debts",
  PRODUCTS: "finmaster_products",
  CUSTOMERS: "finmaster_customers",
  CATEGORIES: "finmaster_categories",
  TEMPLATES: "finmaster_templates",
  UNG_HANG_PAID: "finmaster_ung_hang_paid",
  UNG_HANG_PAID_ITEMS: "finmaster_ung_hang_paid_items",
  RESET_TEMPLATE: "finmaster_reset_template",
};

const broadcastChange = (storageKey, data) => {
  if (typeof window === "undefined") return;
  try {
    const savedUser = window.localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const userId = user?.id ?? user?.userId ?? null;
      if (userId) {
        const channel = new BroadcastChannel(`finmaster_sync_${userId}`);
        channel.postMessage({
          type: 'data_update',
          storageKey: storageKey,
          data: data,
          timestamp: Date.now(),
          userId: userId, // CRITICAL: Thêm userId để validate
        });
        setTimeout(() => channel.close(), 100);
      } else {
        console.warn('[apiSync] No userId, skip broadcast');
      }
    }
  } catch (error) {
    // BroadcastChannel not supported, skip
  }
};

/**
 * Check if server sync is available
 * VITE_NO_SERVER_SYNC=true: Chỉ dùng localStorage, không gửi lên server (phù hợp npm run dev khi test)
 */
function isServerSyncAvailable() {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_NO_SERVER_SYNC === 'true') return false;
  const token = window.localStorage.getItem('auth_token');
  
  // CRITICAL: Kiểm tra userId trước khi sync
  const savedUser = window.localStorage.getItem('auth_user');
  if (!savedUser) return false;
  try {
    const user = JSON.parse(savedUser);
    const userId = user?.id ?? user?.userId ?? null;
    if (!userId) {
      console.warn('[isServerSyncAvailable] No userId found');
      return false;
    }
  } catch (error) {
    console.error('[isServerSyncAvailable] Invalid user data:', error);
    return false;
  }
  
  return !!token;
}

/**
 * Sync product to server
 */
async function syncProductToServer(action, productData, productId = null) {
  if (!isServerSyncAvailable()) {
    return null;
  }

  try {
    const token = window.localStorage.getItem('auth_token');
    if (!token) return null;

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const url = productId 
      ? `${protocol}//${host}/api/products/${productId}`
      : `${protocol}//${host}/api/products`;

    let response;
    if (action === 'add') {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
    } else if (action === 'update') {
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
    } else if (action === 'delete') {
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (response && response.ok) {
      const result = await response.json();
      return result.data || result;
    }
  } catch (error) {
    console.error(`[APISync] Error syncing product (${action}):`, error);
  }
  return null;
}

/**
 * Wrapper for addProduct - syncs with server
 */
export async function addProduct(product) {
  // Always save to localStorage first (for offline support)
  const localProduct = localStorageAddProduct(product);
  
  // Try to sync with server
  const serverProduct = await syncProductToServer('add', product);
  
  // If server sync succeeded, use server data (has correct ID, timestamps, etc.)
  if (serverProduct) {
    const serverId = serverProduct.id ?? localProduct.id;
    const mergedProduct = {
      ...localProduct,
      ...serverProduct,
      id: serverId,
      serverId,
      updatedAt: serverProduct.updatedAt
        ? new Date(serverProduct.updatedAt).getTime()
        : Date.now(),
    };

    // Replace the local placeholder (local id) with the server-backed record
    const products = localStorageGetProducts().filter(
      (p) => String(p.id) !== String(localProduct.id) && String(p.id) !== String(serverId)
    );
    products.push(mergedProduct);

    const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
    window.localStorage.setItem(storageKey, JSON.stringify(products));
    broadcastChange(storageKey, products);

    return mergedProduct;
  }
  
  return { ...localProduct, serverId: localProduct.serverId ?? localProduct.id };
}

/**
 * Wrapper for updateProduct - syncs with server
 */
export async function updateProduct(id, updates) {
  const target = findProductByAnyId(id);
  const storageId = target?.id ?? id;
  const serverId = target?.serverId ?? target?.id ?? id;
  
  // Always update localStorage first
  localStorageUpdateProduct(storageId, updates);
  
  // Try to sync with server
  if (serverId) {
    await syncProductToServer('update', updates, serverId);
  }
  
  // Return updated product from localStorage
  const products = localStorageGetProducts();
  return (
    products.find((p) => String(p.id) === String(storageId)) ||
    products.find((p) => serverId && String(p.serverId) === String(serverId)) ||
    null
  );
}

/**
 * Wrapper for deleteProduct - syncs with server
 */
export async function deleteProduct(id) {
  const target = findProductByAnyId(id);
  const storageId = target?.id ?? id;
  const serverId = target?.serverId ?? target?.id ?? id;

  // Always delete from localStorage first
  localStorageDeleteProduct(storageId);
  
  // Try to sync with server
  if (serverId) {
    await syncProductToServer('delete', null, serverId);
  }
}

/**
 * Sync transaction to server
 */
async function syncTransactionToServer(action, transactionData, transactionId = null) {
  if (!isServerSyncAvailable()) {
    return null;
  }

  try {
    const token = window.localStorage.getItem('auth_token');
    if (!token) return null;

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const url = transactionId 
      ? `${protocol}//${host}/api/transactions/${transactionId}`
      : `${protocol}//${host}/api/transactions`;

    let response;
    if (action === 'add') {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });
    } else if (action === 'update') {
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });
    } else if (action === 'delete') {
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (response && response.ok) {
      const result = await response.json();
      return result.data || result;
    }
  } catch (error) {
    console.error(`[APISync] Error syncing transaction (${action}):`, error);
  }
  return null;
}

/**
 * Wrapper for addTransaction - syncs with server
 */
export async function addTransaction(transaction) {
  // Always save to localStorage first (for offline support)
  const localTransaction = localStorageAddTransaction(transaction);
  
  // Try to sync with server
  const serverTransaction = await syncTransactionToServer('add', transaction);
  
  // If server sync succeeded, use server data (phải dùng server id để PUT/DELETE sau này hoạt động)
  if (serverTransaction) {
    const transactions = localStorageGetTransactions();
    const index = transactions.findIndex(t => t.id === localTransaction.id);
    if (index !== -1) {
      transactions[index] = { ...serverTransaction, id: serverTransaction.id };
      const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
      window.localStorage.setItem(storageKey, JSON.stringify(transactions));
      broadcastChange(storageKey, transactions);
    }
    return { ...serverTransaction };
  }
  
  return localTransaction;
}

/**
 * Wrapper for updateTransaction - syncs with server
 */
export async function updateTransaction(id, updates) {
  // Always update localStorage first
  localStorageUpdateTransaction(id, updates);
  
  // Try to sync with server
  await syncTransactionToServer('update', updates, id);
  
  // Return updated transaction from localStorage
  const transactions = localStorageGetTransactions();
  return transactions.find(t => t.id === id);
}

/**
 * Wrapper for deleteTransaction - syncs with server
 */
export async function deleteTransaction(id) {
  // Always delete from localStorage first
  localStorageDeleteTransaction(id);
  
  // Try to sync with server
  await syncTransactionToServer('delete', null, id);
}

/**
 * Sync category to server
 * Supports: add, delete
 */
async function syncCategoryToServer(action, categoryData, categoryId = null) {
  try {
    if (!isServerSyncAvailable()) {
      return null;
    }

    const token = window.localStorage.getItem('auth_token');
    if (!token) {
      console.warn('[APISync] No auth token for category sync');
      return null;
    }

    let response;
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/categories`;

    if (action === 'add') {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      });
    } else if (action === 'delete') {
      if (!categoryId) {
        console.error('[APISync] Category ID required for delete action');
        return null;
      }
      response = await fetch(`${baseUrl}/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (response && response.ok) {
      const result = await response.json();
      return result.data || result;
    } else if (response) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[APISync] Error syncing category (${action}):`, errorData);
    }
  } catch (error) {
    console.error(`[APISync] Error syncing category (${action}):`, error);
  }
  return null;
}

/**
 * Wrapper for addCategory - syncs with server
 */
export async function addCategory(category) {
  // Always save to localStorage first
  const localCategory = localStorageAddCategory(category);
  
  // Try to sync with server
  const serverCategory = await syncCategoryToServer('add', category);
  
  if (serverCategory && serverCategory.id) {
    // Replace local ID with server ID and update localStorage
    const categories = localStorageGetCategories();
    const type = category.type || 'income';
    const list = Array.isArray(categories?.[type]) ? categories[type] : [];
    const index = list.findIndex(c => c.id === localCategory.id);
    
    if (index !== -1) {
      list[index] = serverCategory;
      const newCategories = { ...categories, [type]: list };
      const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
      window.localStorage.setItem(storageKey, JSON.stringify(newCategories));
      broadcastChange(storageKey, newCategories);
      return serverCategory;
    }
  }
  
  return localCategory;
}

/**
 * Wrapper for deleteCategory - syncs with server
 */
export async function deleteCategory(id, type) {
  // Try to sync with server FIRST (to validate category can be deleted)
  const serverResult = await syncCategoryToServer('delete', null, id);
  
  if (serverResult?.success || serverResult?.message) {
    // Server delete succeeded, now remove from localStorage
    const categories = localStorageGetCategories();
    const list = Array.isArray(categories?.[type]) ? categories[type] : [];
    const filtered = list.filter((c) => c.id !== id);
    const newCategories = { ...categories, [type]: filtered };
    const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
    window.localStorage.setItem(storageKey, JSON.stringify(newCategories));
    broadcastChange(storageKey, newCategories);
    return true;
  } else if (serverResult === null && !isServerSyncAvailable()) {
    // Server sync not available, delete from localStorage only (offline mode)
    const categories = localStorageGetCategories();
    const list = Array.isArray(categories?.[type]) ? categories[type] : [];
    const filtered = list.filter((c) => c.id !== id);
    const newCategories = { ...categories, [type]: filtered };
    const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
    window.localStorage.setItem(storageKey, JSON.stringify(newCategories));
    broadcastChange(storageKey, newCategories);
    return true;
  } else {
    // Server returned error (e.g., category in use)
    console.error('[APISync] Server rejected delete - category may be in use');
    return false;
  }
}

// Default categories (cần để app hoạt động sau reset)
const DEFAULT_CATEGORIES = {
  income: [
    { id: 1, name: "Rút tiền TikTok", type: "income" },
    { id: 2, name: "Rút tiền Shopee", type: "income" },
    { id: 3, name: "Bán lẻ tiền mặt", type: "income" },
    { id: 4, name: "Bán hàng trực tiếp", type: "income" },
  ],
  expense: [
    { id: 5, name: "Nhập hàng", type: "expense" },
    { id: 6, name: "Marketing", type: "expense" },
    { id: 7, name: "Ăn uống", type: "expense" },
    { id: 8, name: "Tiền nhà", type: "expense" },
    { id: 9, name: "Lãi vay", type: "expense" },
  ],
  nhap: [
    { id: 11, name: "Vốn ban đầu", type: "nhap" },
    { id: 12, name: "Chuyển khoản vào", type: "nhap" },
    { id: 13, name: "Số dư đầu kỳ", type: "nhap" },
    { id: 14, name: "Khác", type: "nhap" },
  ],
};

/**
 * Xóa tất cả key localStorage liên quan (kể cả key cũ không có user suffix)
 * Đảm bảo dữ liệu legacy từ trước khi sửa code cũng bị xóa
 */
function clearAllStorageKeys(baseKey, userKey) {
  try {
    window.localStorage.removeItem(baseKey);
    if (userKey && userKey !== baseKey) {
      window.localStorage.removeItem(userKey);
    }
  } catch (e) {
    console.warn('[APISync] Error clearing key:', baseKey, e);
  }
}

/**
 * Reset data - 2 chế độ:
 * - "full": Xóa sạch mọi thứ (sản phẩm, khách hàng, giao dịch, đơn hàng, nợ, số tiền...)
 * - "partial": Giữ lại sản phẩm, khách hàng, nợ cần trả. Chỉ xóa: tiền mặt/ngân hàng, giao dịch, đơn hàng. Reset số lượng sản phẩm về 0.
 */
export async function resetAllData(mode = "full") {
  if (typeof window === "undefined") return;

  const token = isServerSyncAvailable() ? window.localStorage.getItem('auth_token') : null;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.host;
  const emptyArr = [];
  const isFull = mode === "full";

  if (isFull && token) {
    // NEW: Gọi API xóa TOÀN BỘ dữ liệu của user bằng 1 request duy nhất
    // Thay vì xóa từng sản phẩm/transaction 1 → xóa tất cả cùng lúc trên server
    try {
      const res = await fetch(`${protocol}//${host}/api/user/reset-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        throw new Error('Server reset failed');
      }
      
      const result = await res.json();
      console.log('[APISync] Server data reset:', result.message);
    } catch (e) {
      console.error('[APISync] Error resetting data on server:', e);
      console.warn('[APISync] Falling back to old method - deleting items one by one');
    }
  }

  // 3. Xóa sạch - KHÔNG dùng template (tránh trùng lặp, chồng chéo)
  // Trả về trạng thái ngày đầu chưa có hoạt động nào
  const applyEmpty = (key, val) => {
    const storageKey = getStorageKey(key);
    window.localStorage.setItem(storageKey, JSON.stringify(val));
    broadcastChange(storageKey, val);
  };

  // Wallets
  const walletsData = { cash: 0, bank: 0 };
  window.localStorage.setItem(getStorageKey(STORAGE_KEYS.WALLETS), JSON.stringify(walletsData));
  broadcastChange(getStorageKey(STORAGE_KEYS.WALLETS), walletsData);

  // Transactions, Orders, Debts, Products, Customers, Templates, Categories
  const transactionsKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  const ordersKey = getStorageKey(STORAGE_KEYS.ORDERS);
  const debtsKey = getStorageKey(STORAGE_KEYS.DEBTS);
  const productsKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  const customersKey = getStorageKey(STORAGE_KEYS.CUSTOMERS);
  const templatesKey = getStorageKey(STORAGE_KEYS.TEMPLATES);
  const categoriesKey = getStorageKey(STORAGE_KEYS.CATEGORIES);

  if (isFull) {
    // Xóa key cũ (legacy) + RESET_TEMPLATE - đảm bảo không còn dữ liệu cũ, mẫu đã lưu
    [STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.ORDERS, STORAGE_KEYS.DEBTS, STORAGE_KEYS.PRODUCTS, STORAGE_KEYS.CUSTOMERS, STORAGE_KEYS.TEMPLATES, STORAGE_KEYS.UNG_HANG_PAID, STORAGE_KEYS.UNG_HANG_PAID_ITEMS, STORAGE_KEYS.RESET_TEMPLATE].forEach(k => {
      clearAllStorageKeys(k, getStorageKey(k));
    });
    // Ghi đè rỗng - trạng thái ngày đầu chưa có hoạt động (KHÔNG dùng template)
    applyEmpty(STORAGE_KEYS.TRANSACTIONS, emptyArr);
    applyEmpty(STORAGE_KEYS.ORDERS, emptyArr);
    applyEmpty(STORAGE_KEYS.DEBTS, emptyArr);
    applyEmpty(STORAGE_KEYS.PRODUCTS, emptyArr);
    applyEmpty(STORAGE_KEYS.CUSTOMERS, emptyArr);
    applyEmpty(STORAGE_KEYS.TEMPLATES, emptyArr);
    applyEmpty(STORAGE_KEYS.UNG_HANG_PAID, {});
    applyEmpty(STORAGE_KEYS.UNG_HANG_PAID_ITEMS, {});
    applyEmpty(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  } else {
    const products = localStorageGetProducts();
    const productsResetQty = products.map(p => ({ ...p, quantity: 0 }));
    window.localStorage.setItem(productsKey, JSON.stringify(productsResetQty));
    broadcastChange(productsKey, productsResetQty);
    // Partial reset: đồng bộ số lượng 0 lên server để tránh sync ghi đè
    if (token && productsResetQty.length > 0) {
      try {
        await Promise.all(
          productsResetQty.map(p =>
            fetch(`${protocol}//${host}/api/products/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ quantity: 0 }),
            }).catch(() => {})
          )
        );
      } catch (e) {
        console.warn('[APISync] Error syncing product quantities to server:', e);
      }
    }
    applyEmpty(STORAGE_KEYS.TRANSACTIONS, emptyArr);
    applyEmpty(STORAGE_KEYS.ORDERS, emptyArr);
    applyEmpty(STORAGE_KEYS.TEMPLATES, emptyArr);
  }

  // Full reset: đặt flag để initializeStorage (khi reload) tạo dữ liệu rỗng
  // KHÔNG dùng template - tránh trùng lặp, chồng chéo
  if (isFull) {
    try {
      window.sessionStorage.setItem("finmaster_full_reset_ts", Date.now().toString());
    } catch (_) {}
    const initKey = getStorageKey("finmaster_initialized");
    window.localStorage.removeItem(initKey);
    window.localStorage.removeItem("finmaster_initialized");
  }

  console.log(isFull
    ? "✅ Đã reset toàn bộ - sản phẩm, khách hàng, giao dịch, đơn hàng, nợ, số tiền... tất cả xóa sạch"
    : "✅ Đã reset một phần - giữ sản phẩm, khách hàng, nợ. Xóa giao dịch, đơn hàng, tiền mặt/ngân hàng");
  return true;
}

/**
 * Xóa sạch dữ liệu thu chi (Sổ Thu Chi): giao dịch + tiền mặt/ngân hàng về 0.
 * Không xóa: sản phẩm, khách hàng, đơn hàng, nợ, danh mục.
 */
export async function clearAllTransactions() {
  if (typeof window === "undefined") return;

  const token = isServerSyncAvailable() ? window.localStorage.getItem('auth_token') : null;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.host;

  // 1. Xóa tất cả giao dịch trên server
  if (token) {
    try {
      const res = await fetch(`${protocol}//${host}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const serverTx = json.data || [];
        if (serverTx.length > 0) {
          await Promise.all(
            serverTx.map(t =>
              fetch(`${protocol}//${host}/api/transactions/${t.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              }).catch(() => {})
            )
          );
        }
      }
    } catch (e) {
      console.error('[APISync] Error deleting transactions on server:', e);
    }
  }

  // 2. Xóa localStorage (cả key user và key legacy)
  clearAllStorageKeys(STORAGE_KEYS.TRANSACTIONS, getStorageKey(STORAGE_KEYS.TRANSACTIONS));
  const emptyArr = [];
  const transactionsKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  window.localStorage.setItem(transactionsKey, JSON.stringify(emptyArr));
  broadcastChange(transactionsKey, emptyArr);

  // 3. Reset ví về 0
  const walletsData = { cash: 0, bank: 0 };
  window.localStorage.setItem(getStorageKey(STORAGE_KEYS.WALLETS), JSON.stringify(walletsData));
  broadcastChange(getStorageKey(STORAGE_KEYS.WALLETS), walletsData);
  if (token) {
    await fetch(`${protocol}//${host}/api/wallets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(walletsData),
    }).catch(() => {});
  }

  console.log("✅ Đã xóa sạch dữ liệu thu chi (giao dịch + tiền mặt/ngân hàng về 0)");
  return true;
}

export {
  localStorageGetProducts as getProducts,
  localStorageGetTransactions as getTransactions,
  getOrders,
  getCustomers,
  getWallets,
  localStorageGetCategories as getCategories,
  getTemplates,
  getDebts,
  initializeStorage,
  updateWallets,
  addOrder,
  addTemplate,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addDebt,
  updateDebt,
  deleteDebt,
};

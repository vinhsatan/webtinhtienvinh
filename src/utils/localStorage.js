// LocalStorage utility functions for persisting data

// Broadcast data changes to other tabs/windows
const broadcastChange = (storageKey, data) => {
  if (typeof window === "undefined") return;
  
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('[broadcastChange] No userId, skip broadcast');
      return;
    }
    
    // Broadcast using BroadcastChannel API
    const channel = new BroadcastChannel(`finmaster_sync_${userId}`);
    channel.postMessage({
      type: 'data_update',
      storageKey: storageKey,
      data: data,
      timestamp: Date.now(),
      userId: userId, // CRITICAL: Thêm userId để validate
    });
    setTimeout(() => channel.close(), 100);
  } catch (error) {
    // BroadcastChannel not supported, skip
  }
};

// Get current user ID from localStorage (hỗ trợ cả user.id và user.userId)
const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user?.id ?? user?.userId ?? null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
};

// Get storage key with user ID
const getStorageKey = (baseKey) => {
  const userId = getCurrentUserId();
  if (userId) {
    return `${baseKey}_user_${userId}`;
  }
  // Fallback to old key if no user (for backward compatibility)
  return baseKey;
};

/** Ngày local YYYY-MM-DD (tránh lệch timezone) */
export const toLocalDateStr = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

// Safe parse: never return null/undefined for array storage (prevents push on undefined)
const parseJsonArray = (data) => {
  if (!data) return [];
  try {
    const p = JSON.parse(data);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

const STORAGE_KEYS = {
  WALLETS: "finmaster_wallets",
  TRANSACTIONS: "finmaster_transactions",
  ORDERS: "finmaster_orders",
  PRODUCTS: "finmaster_products",
  CATEGORIES: "finmaster_categories",
  TEMPLATES: "finmaster_templates",
  CUSTOMERS: "finmaster_customers",
  DEBTS: "finmaster_debts",
  UNG_HANG_PAID: "finmaster_ung_hang_paid", // { "customerName": amount } - số tiền đã thu ứng hàng theo khách
  UNG_HANG_PAID_ITEMS: "finmaster_ung_hang_paid_items", // { "customerName": { "productId": qty } } - số lượng đã thu theo SP
  INITIALIZED: "finmaster_initialized",
  RESET_TEMPLATE: "finmaster_reset_template",
};

// Initialize with default data if first time
export const initializeStorage = () => {
  if (typeof window === "undefined") return;

  const initializedKey = getStorageKey(STORAGE_KEYS.INITIALIZED);
  const isInitialized = localStorage.getItem(initializedKey);

  if (!isInitialized) {
    // Luôn tạo rỗng - không tạo mẫu dữ liệu (Đậu, Áo, Quần...). Tránh chồng chéo, Tiền Hàng 9.540.000 từ dữ liệu cũ.
    const defaultWallets = { cash: 0, bank: 0 };
    localStorage.setItem(getStorageKey(STORAGE_KEYS.WALLETS), JSON.stringify(defaultWallets));

    // Default Categories (cần cho app hoạt động - thu/chi/nhap)
    const defaultCategories = {
      income: [
        { id: 1, name: "Rút tiền TikTok", type: "income" },
        { id: 2, name: "Rút tiền Shopee", type: "income" },
        { id: 3, name: "Bán lẻ tiền mặt", type: "income" },
        { id: 4, name: "Bán hàng trực tiếp", type: "income" },
      ],
      expense: [
        { id: 5, name: "Nhập hàng", type: "expense" },
        { id: 15, name: "Ứng hàng chưa thu", type: "expense" },
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
    localStorage.setItem(
      getStorageKey(STORAGE_KEYS.CATEGORIES),
      JSON.stringify(defaultCategories),
    );

    // Products, Customers: luôn rỗng - không mẫu dữ liệu cũ
    localStorage.setItem(getStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify([]));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.CUSTOMERS), JSON.stringify([]));

    // Initialize empty arrays
    localStorage.setItem(getStorageKey(STORAGE_KEYS.TRANSACTIONS), JSON.stringify([]));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.ORDERS), JSON.stringify([]));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.TEMPLATES), JSON.stringify([]));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify([]));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.UNG_HANG_PAID), JSON.stringify({}));
    localStorage.setItem(getStorageKey(STORAGE_KEYS.UNG_HANG_PAID_ITEMS), JSON.stringify({}));

    localStorage.setItem(initializedKey, "true");
  }
};

// Wallets
export const getWallets = () => {
  if (typeof window === "undefined") return { cash: 0, bank: 0 };
  const userId = getCurrentUserId();
  const walletsKey = getStorageKey(STORAGE_KEYS.WALLETS);
  let data = localStorage.getItem(walletsKey);
  
  // If no data with userId key, check old key (backward compatibility)
  if (!data && userId) {
    const oldData = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (oldData) {
      // Migrate old data to new key
      localStorage.setItem(walletsKey, oldData);
      localStorage.removeItem(STORAGE_KEYS.WALLETS);
      data = oldData;
      console.log("🔄 Đã migrate dữ liệu wallets từ key cũ sang key mới");
    }
  }
  
  return data ? JSON.parse(data) : { cash: 0, bank: 0 };
};

export const updateWallets = (wallets) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(STORAGE_KEYS.WALLETS), JSON.stringify(wallets));
};

// Transactions
export const getTransactions = () => {
  if (typeof window === "undefined") return [];
  
  // CRITICAL: Validate userId
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.warn('[getTransactions] No userId, return empty');
    return [];
  }
  
  const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  if (!storageKey.includes(`_user_${currentUserId}`)) {
    console.warn('[getTransactions] Storage key mismatch userId');
    return [];
  }
  
  const data = localStorage.getItem(storageKey);
  return parseJsonArray(data);
};

/** Overwrite all transactions in storage (e.g. after sync from server). */
export const setTransactionsData = (transactions) => {
  if (typeof window === "undefined" || !Array.isArray(transactions)) return;
  const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  localStorage.setItem(storageKey, JSON.stringify(transactions));
  broadcastChange(storageKey, transactions);
};

export const addTransaction = (transaction) => {
  if (typeof window === "undefined") return;
  const transactions = getTransactions();
  
  // Tạo ID unique: timestamp + counter để tránh duplicate
  const baseId = Date.now();
  let uniqueId = baseId;
  let counter = 0;
  
  while (transactions.some(t => t.id === uniqueId)) {
    counter++;
    uniqueId = baseId + counter;
  }
  
  const newTransaction = {
    ...transaction,
    id: uniqueId,
    createdAt: new Date().toISOString(),
    updatedAt: Date.now(),
  };
  transactions.push(newTransaction);
  const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  localStorage.setItem(storageKey, JSON.stringify(transactions));
  broadcastChange(storageKey, transactions);
  return newTransaction;
};

export const updateTransaction = (id, updates) => {
  if (typeof window === "undefined") return;
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions[index] = { 
      ...transactions[index], 
      ...updates,
      updatedAt: Date.now(), // Add timestamp for sync
    };
    const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
    localStorage.setItem(storageKey, JSON.stringify(transactions));
    // Broadcast change for real-time sync
    broadcastChange(storageKey, transactions);
  }
};

export const deleteTransaction = (id) => {
  if (typeof window === "undefined") return;
  const transactions = getTransactions();
  const idStr = String(id);
  const filtered = transactions.filter((t) => String(t.id) !== idStr);
  const storageKey = getStorageKey(STORAGE_KEYS.TRANSACTIONS);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
  broadcastChange(storageKey, filtered);
};

// Orders
export const getOrders = () => {
  if (typeof window === "undefined") return [];
  
  // CRITICAL: Validate userId
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.warn('[getOrders] No userId, return empty');
    return [];
  }
  
  const userKey = getStorageKey(STORAGE_KEYS.ORDERS);
  if (!userKey.includes(`_user_${currentUserId}`)) {
    console.warn('[getOrders] Storage key mismatch userId');
    return [];
  }
  
  const data = localStorage.getItem(userKey);
  let parsed = parseJsonArray(data);
  if (parsed.length > 0) {
    // Deduplicate by ID to prevent duplicate products after F5/sync
    const deduped = Array.from(
      new Map(parsed.map(order => [order.id, order])).values()
    );
    if (deduped.length < parsed.length) {
      // If deduplication removed items, save cleaned version
      localStorage.setItem(userKey, JSON.stringify(deduped));
    }
    return deduped;
  }

  // Fallback: migrate legacy key (no user suffix) if exists
  const legacyKey = STORAGE_KEYS.ORDERS;
  if (legacyKey !== userKey) {
    const legacyData = localStorage.getItem(legacyKey);
    const legacyParsed = parseJsonArray(legacyData);
    if (legacyParsed.length > 0) {
      localStorage.setItem(userKey, JSON.stringify(legacyParsed));
      return legacyParsed;
    }
  }
  return parsed;
};

export const addOrder = (order) => {
  if (typeof window === "undefined") return;
  const orders = getOrders();
  
  // Tạo ID unique: timestamp + counter để tránh duplicate
  const baseId = Date.now();
  let uniqueId = baseId;
  let counter = 0;
  
  while (orders.some(o => o.id === uniqueId)) {
    counter++;
    uniqueId = baseId + counter;
  }
  
  const newOrder = {
    ...order,
    id: uniqueId,
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  const storageKey = getStorageKey(STORAGE_KEYS.ORDERS);
  localStorage.setItem(storageKey, JSON.stringify(orders));
  broadcastChange(storageKey, orders);
  return newOrder;
};

export const updateOrder = (id, updates) => {
  if (typeof window === "undefined") return;
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    const storageKey = getStorageKey(STORAGE_KEYS.ORDERS);
    localStorage.setItem(storageKey, JSON.stringify(orders));
    broadcastChange(storageKey, orders);
    return orders[index];
  }
  return null;
};

export const deleteOrder = (id) => {
  if (typeof window === "undefined") return;
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== id);
  const storageKey = getStorageKey(STORAGE_KEYS.ORDERS);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
  // Broadcast change for real-time sync
  broadcastChange(storageKey, filtered);
};

// Ứng hàng - số tiền đã thu theo khách (cho thanh toán từng phần)
export const getUngHangPaid = () => {
  if (typeof window === "undefined") return {};
  try {
    const userKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID);
    const data = localStorage.getItem(userKey);
    const obj = data ? JSON.parse(data) : {};
    if (typeof obj === "object" && obj !== null && Object.keys(obj).length > 0) return obj;

    // Fallback: migrate legacy key (no user suffix)
    const legacyKey = STORAGE_KEYS.UNG_HANG_PAID;
    if (legacyKey !== userKey) {
      const legacyData = localStorage.getItem(legacyKey);
      const legacyObj = legacyData ? JSON.parse(legacyData) : {};
      if (typeof legacyObj === "object" && legacyObj !== null && Object.keys(legacyObj).length > 0) {
        localStorage.setItem(userKey, JSON.stringify(legacyObj));
        return legacyObj;
      }
    }
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch {
    return {};
  }
};

export const addUngHangPayment = (customerName, amount) => {
  if (typeof window === "undefined" || !customerName) return;
  const paid = getUngHangPaid();
  const key = String(customerName).trim() || "Khách lẻ";
  paid[key] = (paid[key] || 0) + amount;
  const storageKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID);
  localStorage.setItem(storageKey, JSON.stringify(paid));
  broadcastChange(storageKey, paid);
};

/** Xóa số tiền đã thu của 1 khách (khi đã thanh toán đủ) */
export const clearUngHangPaidForCustomer = (customerName) => {
  if (typeof window === "undefined") return;
  const paid = getUngHangPaid();
  const key = String(customerName).trim() || "Khách lẻ";
  delete paid[key];
  const storageKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID);
  localStorage.setItem(storageKey, JSON.stringify(paid));
  broadcastChange(storageKey, paid);
  clearUngHangPaidItemsForCustomer(customerName);
};

// Ứng hàng - số lượng đã thu theo từng sản phẩm (cho thanh toán theo SP)
export const getUngHangPaidItems = () => {
  if (typeof window === "undefined") return {};
  try {
    const userKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID_ITEMS);
    const data = localStorage.getItem(userKey);
    const obj = data ? JSON.parse(data) : {};
    if (typeof obj === "object" && obj !== null && Object.keys(obj).length > 0) return obj;

    // Fallback: migrate legacy key (no user suffix)
    const legacyKey = STORAGE_KEYS.UNG_HANG_PAID_ITEMS;
    if (legacyKey !== userKey) {
      const legacyData = localStorage.getItem(legacyKey);
      const legacyObj = legacyData ? JSON.parse(legacyData) : {};
      if (typeof legacyObj === "object" && legacyObj !== null && Object.keys(legacyObj).length > 0) {
        localStorage.setItem(userKey, JSON.stringify(legacyObj));
        return legacyObj;
      }
    }
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch {
    return {};
  }
};

export const addUngHangPaidItems = (customerName, itemsDelta) => {
  if (typeof window === "undefined" || !customerName || !itemsDelta) return;
  const paid = getUngHangPaidItems();
  const key = String(customerName).trim() || "Khách lẻ";
  if (!paid[key]) paid[key] = {};
  for (const [pid, qty] of Object.entries(itemsDelta)) {
    paid[key][pid] = (paid[key][pid] || 0) + (parseFloat(qty) || 0);
  }
  const storageKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID_ITEMS);
  localStorage.setItem(storageKey, JSON.stringify(paid));
  broadcastChange(storageKey, paid);
};

export const clearUngHangPaidItemsForCustomer = (customerName) => {
  if (typeof window === "undefined") return;
  const paid = getUngHangPaidItems();
  const key = String(customerName).trim() || "Khách lẻ";
  delete paid[key];
  const storageKey = getStorageKey(STORAGE_KEYS.UNG_HANG_PAID_ITEMS);
  localStorage.setItem(storageKey, JSON.stringify(paid));
  broadcastChange(storageKey, paid);
};

// Products
export const getProducts = () => {
  if (typeof window === "undefined") return [];
  
  // CRITICAL: Validate userId trước khi lấy dữ liệu
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.warn('[getProducts] No userId, return empty');
    return [];
  }
  
  const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  // CRITICAL: Kiểm tra key có chứa đúng userId hiện tại không
  if (!storageKey.includes(`_user_${currentUserId}`)) {
    console.warn('[getProducts] Storage key mismatch userId:', storageKey, currentUserId);
    return [];
  }
  
  const data = localStorage.getItem(storageKey);
  const products = parseJsonArray(data);
  
  // Loại bỏ trùng theo serverId (ưu tiên), fallback id (giữ bản mới nhất theo updatedAt)
  const byCanonicalId = new Map();

  products.forEach(p => {
    const canonicalId = p?.serverId ?? p?.id;
    if (!canonicalId) {
      console.warn('⚠️ Sản phẩm không có ID:', p);
      return;
    }
    const key = String(canonicalId);
    const existing = byCanonicalId.get(key);
    if (!existing) {
      byCanonicalId.set(key, p);
      return;
    }
    const existingTs = existing.updatedAt || existing.createdAt || 0;
    const incomingTs = p.updatedAt || p.createdAt || 0;
    if (incomingTs >= existingTs) {
      byCanonicalId.set(key, p);
    }
  });

  const unique = Array.from(byCanonicalId.values());

  if (unique.length !== products.length) {
    console.log(`🔧 Đã loại bỏ ${products.length - unique.length} sản phẩm trùng ID/serverId`);
    const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
    localStorage.setItem(storageKey, JSON.stringify(unique));
  }

  return unique;
};

/** Overwrite all products in storage (e.g. after sync from server). */
export const setProductsData = (products) => {
  if (typeof window === "undefined" || !Array.isArray(products)) return;
  const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  localStorage.setItem(storageKey, JSON.stringify(products));
  broadcastChange(storageKey, products);
};

export const addProduct = (product) => {
  if (typeof window === "undefined") return;
  const products = getProducts();
  
  // Tạo ID unique: timestamp + random để tránh duplicate khi import nhiều sản phẩm cùng lúc
  const baseId = Date.now();
  let uniqueId = baseId;
  let counter = 0;
  
  // Kiểm tra xem ID đã tồn tại chưa, nếu có thì tăng thêm
  while (products.some(p => p.id === uniqueId)) {
    counter++;
    uniqueId = baseId + counter;
  }
  
  const newProduct = {
    ...product,
    id: uniqueId,
    serverId: product?.serverId ?? product?.id ?? uniqueId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  products.push(newProduct);
  const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  localStorage.setItem(storageKey, JSON.stringify(products));
  broadcastChange(storageKey, products);
  return newProduct;
};

export const updateProduct = (id, updates) => {
  if (typeof window === "undefined") return;
  const products = getProducts();
  const index = products.findIndex((p) => String(p.id) === String(id) || (p.serverId && String(p.serverId) === String(id)));
  if (index !== -1) {
    products[index] = { 
      ...products[index], 
      ...updates,
      updatedAt: Date.now(), // Add timestamp for sync
    };
    const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
    localStorage.setItem(storageKey, JSON.stringify(products));
    
    // Broadcast change for real-time sync
    broadcastChange(storageKey, products);
    
    return products[index]; // Return updated product
  }
  return null;
};

export const deleteProduct = (id) => {
  if (typeof window === "undefined") return;
  const products = getProducts();
  const filtered = products.filter((p) => String(p.id) !== String(id) && (!p.serverId || String(p.serverId) !== String(id)));
  const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
  // Broadcast change for real-time sync
  broadcastChange(storageKey, filtered);
};

// Categories
const DEFAULT_NHAP_CATEGORIES = [
  { id: 11, name: "Vốn ban đầu", type: "nhap" },
  { id: 12, name: "Chuyển khoản vào", type: "nhap" },
  { id: 13, name: "Số dư đầu kỳ", type: "nhap" },
  { id: 14, name: "Khác", type: "nhap" },
];

const DEFAULT_CATEGORIES_OBJ = {
  income: [
    { id: 1, name: "Rút tiền TikTok", type: "income" },
    { id: 2, name: "Rút tiền Shopee", type: "income" },
    { id: 3, name: "Bán lẻ tiền mặt", type: "income" },
    { id: 4, name: "Bán hàng trực tiếp", type: "income" },
  ],
  expense: [
    { id: 5, name: "Nhập hàng", type: "expense" },
    { id: 15, name: "Ứng hàng chưa thu", type: "expense" },
    { id: 6, name: "Marketing", type: "expense" },
    { id: 7, name: "Ăn uống", type: "expense" },
    { id: 8, name: "Tiền nhà", type: "expense" },
    { id: 9, name: "Lãi vay", type: "expense" },
  ],
  nhap: DEFAULT_NHAP_CATEGORIES,
};

export const getCategories = () => {
  if (typeof window === "undefined") return { ...DEFAULT_CATEGORIES_OBJ };
  try {
    const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
    let data = localStorage.getItem(storageKey);
    
    // Fallback to global key if user key is empty
    if (!data) {
      const globalKey = STORAGE_KEYS.CATEGORIES;
      data = localStorage.getItem(globalKey);
    }
    
    let categories = data ? JSON.parse(data) : null;
  
    // Nếu chưa có categories hoàn toàn, tạo default
    if (!categories || typeof categories !== 'object') {
      console.log('[getCategories] No categories found, initializing with defaults');
      const defaultCats = { ...DEFAULT_CATEGORIES_OBJ };
      localStorage.setItem(storageKey, JSON.stringify(defaultCats));
      return defaultCats;
    }
    
    // Ensure all types exist (income, expense, nhap) - CRITICAL FIX
    let modified = false;
    if (!Array.isArray(categories.income) || categories.income === null) {
      categories.income = [];
      modified = true;
    }
    if (!Array.isArray(categories.expense) || categories.expense === null) {
      categories.expense = [];
      modified = true;
    }
    if (!Array.isArray(categories.nhap) || categories.nhap === null) {
      categories.nhap = [...DEFAULT_NHAP_CATEGORIES];
      modified = true;
    }
    
    // Save if we had to fix structure
    if (modified) {
      console.log('[getCategories] Fixed categories structure and saved');
      localStorage.setItem(storageKey, JSON.stringify(categories));
    }
    return categories;
  } catch (e) {
    console.warn('[getCategories] Error, using defaults:', e);
    // On error, reset to defaults
    try {
      const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
      const defaultCats = { ...DEFAULT_CATEGORIES_OBJ };
      localStorage.setItem(storageKey, JSON.stringify(defaultCats));
    } catch (err) {
      console.error('[getCategories] Failed to save defaults:', err);
    }
    return { ...DEFAULT_CATEGORIES_OBJ };
  }
};

export const addCategory = (category) => {
  if (typeof window === "undefined") return null;
  const type = String(category?.type || "income").toLowerCase();
  const newCategory = { ...category, id: Date.now(), type };
  try {
    let categories = getCategories();
    // Đảm bảo luôn có đủ income, expense, nhap (tránh lỗi khi thiếu nhap)
    const income = Array.isArray(categories?.income) ? [...categories.income] : [];
    const expense = Array.isArray(categories?.expense) ? [...categories.expense] : [];
    let nhap = Array.isArray(categories?.nhap) ? [...categories.nhap] : [];
    if (type === "income") income.push(newCategory);
    else if (type === "expense") expense.push(newCategory);
    else nhap.push(newCategory); // "nhap" hoặc bất kỳ loại nào khác
    const updated = { income, expense, nhap };
    const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    broadcastChange(storageKey, updated);
    return newCategory;
  } catch (e) {
    console.error("[addCategory] Error:", e);
    try {
      const fallback = {
        income: [...(DEFAULT_CATEGORIES_OBJ.income || [])],
        expense: [...(DEFAULT_CATEGORIES_OBJ.expense || [])],
        nhap: [...(DEFAULT_CATEGORIES_OBJ.nhap || [])],
      };
      const newCat = { ...category, id: Date.now(), type };
      if (type === "income") fallback.income.push(newCat);
      else if (type === "expense") fallback.expense.push(newCat);
      else fallback.nhap.push(newCat);
      localStorage.setItem(getStorageKey(STORAGE_KEYS.CATEGORIES), JSON.stringify(fallback));
      broadcastChange(getStorageKey(STORAGE_KEYS.CATEGORIES), fallback);
      return newCat;
    } catch (e2) {
      console.error("[addCategory] Fallback failed:", e2);
      return null;
    }
  }
};

export const updateCategory = (id, updates) => {
  if (typeof window === "undefined") return;
  const categories = getCategories();
  const type = updates.type || "income";
  const list = Array.isArray(categories?.[type]) ? categories[type] : [];
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    const updated = [...list];
    updated[index] = { ...updated[index], ...updates };
    const newCategories = { ...categories, [type]: updated };
    localStorage.setItem(getStorageKey(STORAGE_KEYS.CATEGORIES), JSON.stringify(newCategories));
    broadcastChange(getStorageKey(STORAGE_KEYS.CATEGORIES), newCategories);
  }
};

export const deleteCategory = (id, type) => {
  if (typeof window === "undefined") return;
  const categories = getCategories();
  const list = Array.isArray(categories?.[type]) ? categories[type] : [];
  const filtered = list.filter((c) => c.id !== id);
  const newCategories = { ...categories, [type]: filtered };
  const storageKey = getStorageKey(STORAGE_KEYS.CATEGORIES);
  localStorage.setItem(storageKey, JSON.stringify(newCategories));
  broadcastChange(storageKey, newCategories);
};

// Templates
export const getTemplates = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(getStorageKey(STORAGE_KEYS.TEMPLATES));
  return parseJsonArray(data);
};

export const addTemplate = (template) => {
  if (typeof window === "undefined") return;
  const templates = getTemplates();
  const newTemplate = {
    ...template,
    id: Date.now(),
  };
  templates.push(newTemplate);
  localStorage.setItem(getStorageKey(STORAGE_KEYS.TEMPLATES), JSON.stringify(templates));
  return newTemplate;
};

// Customers
export const getCustomers = () => {
  if (typeof window === "undefined") return [];
  
  // CRITICAL: Validate userId
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.warn('[getCustomers] No userId, return empty');
    return [];
  }
  
  const storageKey = getStorageKey(STORAGE_KEYS.CUSTOMERS);
  if (!storageKey.includes(`_user_${currentUserId}`)) {
    console.warn('[getCustomers] Storage key mismatch userId');
    return [];
  }
  
  const data = localStorage.getItem(storageKey);
  return parseJsonArray(data);
};

export const addCustomer = (customer) => {
  if (typeof window === "undefined") return;
  const customers = getCustomers();
  const newCustomer = {
    ...customer,
    id: Date.now(),
  };
  customers.push(newCustomer);
  const storageKey = getStorageKey(STORAGE_KEYS.CUSTOMERS);
  localStorage.setItem(storageKey, JSON.stringify(customers));
  // Broadcast change for real-time sync
  broadcastChange(storageKey, customers);
  return newCustomer;
};

export const updateCustomer = (id, updates) => {
  if (typeof window === "undefined") return;
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...updates };
    const storageKey = getStorageKey(STORAGE_KEYS.CUSTOMERS);
    localStorage.setItem(storageKey, JSON.stringify(customers));
    // Broadcast change for real-time sync
    broadcastChange(storageKey, customers);
  }
};

export const deleteCustomer = (id) => {
  if (typeof window === "undefined") return;
  const customers = getCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  const storageKey = getStorageKey(STORAGE_KEYS.CUSTOMERS);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
  // Broadcast change for real-time sync
  broadcastChange(storageKey, filtered);
};

// Debts (Khoản nợ định kỳ)
export const getDebts = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(getStorageKey(STORAGE_KEYS.DEBTS));
  return parseJsonArray(data);
};

export const addDebt = (debt) => {
  if (typeof window === "undefined") return;
  const debts = getDebts();
  const newDebt = {
    ...debt,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  debts.push(newDebt);
  localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify(debts));
  return newDebt;
};

export const updateDebt = (id, updates) => {
  if (typeof window === "undefined") return;
  const debts = getDebts();
  const index = debts.findIndex((d) => d.id === id);
  if (index !== -1) {
    debts[index] = { ...debts[index], ...updates };
    localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify(debts));
  }
};

export const deleteDebt = (id) => {
  if (typeof window === "undefined") return;
  const debts = getDebts();
  const filtered = debts.filter((d) => d.id !== id);
  localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify(filtered));
};

/**
 * Lưu trạng thái hiện tại làm mẫu reset.
 * Khi reset toàn bộ sau này sẽ khôi phục về đúng trạng thái này.
 */
export const saveResetTemplate = () => {
  if (typeof window === "undefined") return false;
  try {
    const template = {
      products: getProducts(),
      customers: getCustomers(),
      transactions: getTransactions(),
      orders: getOrders(),
      debts: getDebts(),
      wallets: getWallets(),
      categories: getCategories(),
      templates: getTemplates(),
      savedAt: new Date().toISOString(),
    };
    const key = getStorageKey(STORAGE_KEYS.RESET_TEMPLATE);
    localStorage.setItem(key, JSON.stringify(template));
    broadcastChange(key, template);
    return true;
  } catch (e) {
    console.error("Error saving reset template:", e);
    return false;
  }
};

/**
 * Lấy mẫu reset đã lưu (nếu có).
 */
export const getResetTemplate = () => {
  if (typeof window === "undefined") return null;
  try {
    const key = getStorageKey(STORAGE_KEYS.RESET_TEMPLATE);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Lưu trạng thái TRỐNG làm mẫu reset (Sổ Thu Chi rỗng, không giao dịch, không ứng hàng...).
 * Dùng khi bạn đã xóa sạch thủ công và muốn reset toàn bộ sau này trả về đúng trạng thái trống.
 */
export const saveEmptyAsResetTemplate = () => {
  if (typeof window === "undefined") return false;
  try {
    const defaultCategories = {
      income: [
        { id: 1, name: "Rút tiền TikTok", type: "income" },
        { id: 2, name: "Rút tiền Shopee", type: "income" },
        { id: 3, name: "Bán lẻ tiền mặt", type: "income" },
        { id: 4, name: "Bán hàng trực tiếp", type: "income" },
      ],
      expense: [
        { id: 5, name: "Nhập hàng", type: "expense" },
        { id: 15, name: "Ứng hàng chưa thu", type: "expense" },
        { id: 6, name: "Marketing", type: "expense" },
        { id: 7, name: "Ăn uống", type: "expense" },
        { id: 8, name: "Tiền nhà", type: "expense" },
        { id: 9, name: "Lãi vay", type: "expense" },
      ],
    };
    const template = {
      products: [],
      customers: [],
      transactions: [],
      orders: [],
      debts: [],
      wallets: { cash: 0, bank: 0 },
      categories: defaultCategories,
      templates: [],
      savedAt: new Date().toISOString(),
      isEmpty: true,
    };
    const key = getStorageKey(STORAGE_KEYS.RESET_TEMPLATE);
    localStorage.setItem(key, JSON.stringify(template));
    broadcastChange(key, template);
    return true;
  } catch (e) {
    console.error("Error saving empty reset template:", e);
    return false;
  }
};

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
    { id: 15, name: "Ứng hàng chưa thu", type: "expense" },
    { id: 6, name: "Marketing", type: "expense" },
    { id: 7, name: "Ăn uống", type: "expense" },
    { id: 8, name: "Tiền nhà", type: "expense" },
    { id: 9, name: "Lãi vay", type: "expense" },
  ],
};

/**
 * Xóa tất cả key legacy (không có _user_) để tránh conflict
 */
const removeLegacyKeys = () => {
  if (typeof window === "undefined") return;
  
  const userId = getCurrentUserId();
  if (!userId) return; // Chỉ xóa khi đã đăng nhập
  
  const legacyKeys = [
    STORAGE_KEYS.WALLETS,
    STORAGE_KEYS.TRANSACTIONS,
    STORAGE_KEYS.ORDERS,
    STORAGE_KEYS.PRODUCTS,
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.TEMPLATES,
    STORAGE_KEYS.CUSTOMERS,
    STORAGE_KEYS.DEBTS,
    STORAGE_KEYS.UNG_HANG_PAID,
    STORAGE_KEYS.UNG_HANG_PAID_ITEMS,
  ];
  
  let removedCount = 0;
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`✅ Đã xóa ${removedCount} key legacy (không có user ID)`);
  }
};

/**
 * Xóa sạch toàn bộ dữ liệu trong localStorage (dùng CÙNG key với getProducts, getTransactions...)
 * Đảm bảo reset dùng đúng key để không còn dữ liệu cũ
 */
export const clearAllData = () => {
  if (typeof window === "undefined") return;
  
  // Xóa key legacy trước
  removeLegacyKeys();
  
  const emptyArr = [];
  const walletsData = { cash: 0, bank: 0 };

  localStorage.setItem(getStorageKey(STORAGE_KEYS.WALLETS), JSON.stringify(walletsData));
  broadcastChange(getStorageKey(STORAGE_KEYS.WALLETS), walletsData);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.TRANSACTIONS), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.TRANSACTIONS), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.ORDERS), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.ORDERS), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.DEBTS), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.PRODUCTS), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.CUSTOMERS), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.CUSTOMERS), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.TEMPLATES), JSON.stringify(emptyArr));
  broadcastChange(getStorageKey(STORAGE_KEYS.TEMPLATES), emptyArr);

  localStorage.setItem(getStorageKey(STORAGE_KEYS.CATEGORIES), JSON.stringify(DEFAULT_CATEGORIES_OBJ));
  broadcastChange(getStorageKey(STORAGE_KEYS.CATEGORIES), DEFAULT_CATEGORIES_OBJ);

  console.log("✅ [localStorage] Đã xóa sạch toàn bộ dữ liệu");
};

// Reset all data to zero/empty
// GIỮ NGUYÊN: Khách hàng, Danh sách sản phẩm, Danh mục, Templates
export const resetAllData = () => {
  if (typeof window === "undefined") return;
  
  // Xóa key legacy trước
  removeLegacyKeys();
  
  const userId = getCurrentUserId();
  const walletsKey = getStorageKey(STORAGE_KEYS.WALLETS);
  
  // Reset wallets to zero
  localStorage.setItem(walletsKey, JSON.stringify({ cash: 0, bank: 0 }));
  
  // Also remove old key without userId if exists (for backward compatibility cleanup)
  if (userId) {
    const oldWalletsKey = STORAGE_KEYS.WALLETS;
    const oldData = localStorage.getItem(oldWalletsKey);
    if (oldData) {
      console.log("⚠️ Phát hiện dữ liệu cũ (không có userId), đang xóa...");
      localStorage.removeItem(oldWalletsKey);
    }
  }
  
  // GIỮ NGUYÊN: Products - không thay đổi gì cả (giữ nguyên tất cả thông tin sản phẩm)
  // Products sẽ không bị reset, giữ nguyên danh sách sản phẩm
  
  // Clear transactions
  localStorage.setItem(getStorageKey(STORAGE_KEYS.TRANSACTIONS), JSON.stringify([]));
  
  // Clear orders
  localStorage.setItem(getStorageKey(STORAGE_KEYS.ORDERS), JSON.stringify([]));
  
  // Clear ung hang paid (ứng hàng đã thu theo khách)
  localStorage.setItem(getStorageKey(STORAGE_KEYS.UNG_HANG_PAID), JSON.stringify({}));
  localStorage.setItem(getStorageKey(STORAGE_KEYS.UNG_HANG_PAID_ITEMS), JSON.stringify({}));
  
  // Clear debts
  localStorage.setItem(getStorageKey(STORAGE_KEYS.DEBTS), JSON.stringify([]));
  
  // GIỮ NGUYÊN: Categories, Templates, Customers - không thay đổi gì cả
  
  // Verify reset was successful
  const verifyWallets = getWallets();
  const verifyProducts = getProducts();
  const verifyCustomers = getCustomers();
  console.log("✅ Đã reset dữ liệu:");
  console.log("- Tiền mặt và ngân hàng: 0");
  console.log("- Giao dịch: đã xóa");
  console.log("- Đơn hàng: đã xóa");
  console.log("- Khoản nợ: đã xóa");
  console.log("✅ GIỮ NGUYÊN:");
  console.log(`- Danh sách sản phẩm: ${verifyProducts.length} sản phẩm`);
  console.log(`- Khách hàng: ${verifyCustomers.length} khách hàng`);
  console.log("- Danh mục: giữ nguyên");
  console.log("- Templates: giữ nguyên");
  console.log("🔍 Xác minh reset wallets:", verifyWallets);
  console.log("🔍 Storage key đã dùng:", walletsKey);
  
  return true;
};

// Xóa TOÀN BỘ dữ liệu (localStorage + sessionStorage + auth) - chỉ giữ logic
export const clearAllStoredData = (clearAuth = true) => {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith("finmaster_")) {
      localStorage.removeItem(key);
      removed++;
    }
  }
  if (clearAuth) {
    if (localStorage.getItem("auth_token")) { localStorage.removeItem("auth_token"); removed++; }
    if (localStorage.getItem("auth_user")) { localStorage.removeItem("auth_user"); removed++; }
  }
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("finmaster_")) {
      sessionStorage.removeItem(key);
      removed++;
    }
  }
  return removed;
};

/**
 * Xóa sạch TOÀN BỘ dữ liệu và tạo mới lại.
 * Gọi từ Console: clearAndRecreate()
 * - Xóa hết localStorage (finmaster_*), sessionStorage, auth
 * - Tự động reload trang → app khởi tạo lại với dữ liệu trống
 * - Cần đăng nhập lại sau khi reload
 */
export const clearAndRecreate = () => {
  if (typeof window === "undefined") return;
  const removed = clearAllStoredData(true);
  console.log("✅ Đã xóa " + removed + " key. Đang reload trang...");
  window.location.reload();
};

/**
 * Làm sạch sản phẩm trùng lặp (duplicate products)
 * Gọi từ Console: fixDuplicateProducts()
 */
export const fixDuplicateProducts = () => {
  if (typeof window === "undefined") return;
  
  console.log('🔍 Bắt đầu kiểm tra sản phẩm trùng lặp...');
  
  const storageKey = getStorageKey(STORAGE_KEYS.PRODUCTS);
  console.log('📌 Storage key:', storageKey);
  
  const rawData = localStorage.getItem(storageKey);
  if (!rawData) {
    console.log('ℹ️ Không tìm thấy dữ liệu sản phẩm');
    return;
  }
  
  let products = [];
  try {
    products = JSON.parse(rawData);
    if (!Array.isArray(products)) {
      console.error('❌ Dữ liệu sản phẩm không phải mảng');
      return;
    }
  } catch (e) {
    console.error('❌ Lỗi parse JSON:', e);
    return;
  }
  
  const originalCount = products.length;
  console.log(`📊 Tổng số sản phẩm hiện tại: ${originalCount}`);
  
  // Phân tích duplicate
  const idCount = new Map();
  products.forEach(p => {
    if (p.id) {
      idCount.set(p.id, (idCount.get(p.id) || 0) + 1);
    }
  });
  
  const duplicateIds = Array.from(idCount.entries()).filter(([id, count]) => count > 1);
  console.log(`  - Sản phẩm trùng ID: ${duplicateIds.length} ID bị trùng`);
  
  if (duplicateIds.length > 0) {
    console.log('  Top 5 ID trùng nhiều nhất:');
    duplicateIds.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([id, count]) => {
      const product = products.find(p => p.id === id);
      console.log(`    ID ${id}: ${count} lần - "${product?.name || 'N/A'}"`);
    });
  }
  
  // Loại bỏ duplicate - ưu tiên quantity > 0 và mới nhất
  const seenIds = new Set();
  const uniqueProducts = [];
  const removedProducts = [];
  
  const sorted = [...products].sort((a, b) => {
    const aHasStock = (a.quantity || 0) > 0;
    const bHasStock = (b.quantity || 0) > 0;
    if (aHasStock !== bHasStock) return bHasStock ? 1 : -1;
    const aTime = a.updatedAt || a.createdAt || 0;
    const bTime = b.updatedAt || b.createdAt || 0;
    return bTime - aTime;
  });
  
  sorted.forEach(p => {
    if (!p.id || seenIds.has(p.id)) {
      removedProducts.push(p);
      return;
    }
    seenIds.add(p.id);
    uniqueProducts.push(p);
  });
  
  const removedCount = originalCount - uniqueProducts.length;
  
  console.log(`\n✅ Kết quả:`);
  console.log(`  - Sản phẩm ban đầu: ${originalCount}`);
  console.log(`  - Sản phẩm sau khi làm sạch: ${uniqueProducts.length}`);
  console.log(`  - Đã loại bỏ: ${removedCount} sản phẩm trùng lặp`);
  
  if (removedCount > 0) {
    console.log('\n🗑️ Một số sản phẩm đã loại bỏ (top 10):');
    removedProducts.slice(0, 10).forEach(p => {
      console.log(`  - ID ${p.id}: "${p.name}" (Tồn: ${p.quantity || 0})`);
    });
    
    localStorage.setItem(storageKey, JSON.stringify(uniqueProducts));
    broadcastChange(storageKey, uniqueProducts);
    console.log('\n💾 Đã lưu dữ liệu đã làm sạch');
    console.log('🔄 Nhấn F5 để tải lại trang và thấy kết quả');
  } else {
    console.log('\n✨ Không có sản phẩm trùng lặp!');
  }
  
  return {
    original: originalCount,
    unique: uniqueProducts.length,
    removed: removedCount
  };
};

// Make helpers available globally for console access
if (typeof window !== "undefined") {
  window.resetAllData = resetAllData;
  window.clearAllStoredData = clearAllStoredData;
  window.clearAndRecreate = clearAndRecreate;
  window.fixDuplicateProducts = fixDuplicateProducts;
  if (process.env.NODE_ENV === "development") {
    console.log(
      "💡 Tip: clearAndRecreate() = xóa sạch + reload. resetAllData('full') = xóa toàn bộ. fixDuplicateProducts() = làm sạch duplicate."
    );
  }
}

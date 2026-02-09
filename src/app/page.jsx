import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import CashflowSidebar from "@/components/CashflowSidebar";
import { useAuth } from "@/contexts/AuthContext";
import WalletsModule from "@/components/WalletsModule";
import OrdersModule from "@/components/OrdersModule";
import CashflowLedgerModule from "@/components/CashflowLedgerModule";
import ReportsModule from "@/components/ReportsModule";
import SettingsModule from "@/components/SettingsModule";
import AdminModule from "@/components/AdminModule";
import TelegramChatModule from "@/components/TelegramChatModule";
import ChatSupportModule from "@/components/ChatSupportModule";
// Use apiSync wrapper for products, transactions, and reset (auto-syncs with server)
import {
  addProduct as apiAddProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  addTransaction as apiAddTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  resetAllData as apiResetAllData,
  getProducts,
  getTransactions,
} from "@/utils/apiSync";

// Server sync - static import to avoid "syncProducts is not a function" (dynamic import cache issues)
import {
  startServerSync,
  stopServerSync,
  syncProducts,
  syncTransactions,
  syncOrders,
  syncCustomers,
  syncWallets,
  syncCategories,
  syncTemplates,
} from "@/utils/serverSync";

// User ID Guard - Bảo vệ dữ liệu multi-user
import { startUserIdGuard, stopUserIdGuard } from "@/utils/userIdGuard";

// Use localStorage directly for other data (will be migrated gradually)
import * as localStorageUtils from "@/utils/localStorage";
const {
  initializeStorage,
  getWallets,
  updateWallets,
  setTransactionsData,
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getCategories,
  addCategory,
  deleteCategory,
  getTemplates,
  addTemplate,
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getDebts,
  addDebt,
  updateDebt,
  setProductsData,
} = localStorageUtils;

// Define default categories OUTSIDE component to prevent recreation on every render
const DEFAULT_INCOME_CATS = [
  { id: 1, name: "Rút tiền TikTok", type: "income" },
  { id: 2, name: "Rút tiền Shopee", type: "income" },
  { id: 3, name: "Bán lẻ tiền mặt", type: "income" },
  { id: 4, name: "Bán hàng trực tiếp", type: "income" },
];
const DEFAULT_EXPENSE_CATS = [
  { id: 5, name: "Nhập hàng", type: "expense" },
  { id: 15, name: "Ứng hàng chưa thu", type: "expense" },
  { id: 6, name: "Marketing", type: "expense" },
  { id: 7, name: "Ăn uống", type: "expense" },
  { id: 8, name: "Tiền nhà", type: "expense" },
  { id: 9, name: "Lãi vay", type: "expense" },
];
const DEFAULT_NHAP_CATS = [
  { id: 11, name: "Vốn ban đầu", type: "nhap" },
  { id: 12, name: "Chuyển khoản vào", type: "nhap" },
  { id: 13, name: "Số dư đầu kỳ", type: "nhap" },
  { id: 14, name: "Khác", type: "nhap" },
];

export default function HomePage() {
  const { isAuthenticated, loading: authLoading, user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("wallets");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Debug log
    console.log('[HomePage] Auth check:', { isAuthenticated, authLoading });
    
    if (!authLoading && !isAuthenticated) {
      console.log('[HomePage] Redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // State
  const [wallets, setWallets] = useState({ cash: 0, bank: 0 });
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [], nhap: [] });
  const [templates, setTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dataResetKey, setDataResetKey] = useState(0);

  // Helper function to safely load categories with fallbacks
  const loadSafeCategories = () => {
    const cats = getCategories();
    const result = {
      income: (Array.isArray(cats?.income) && cats.income.length > 0) ? cats.income : DEFAULT_INCOME_CATS,
      expense: (Array.isArray(cats?.expense) && cats.expense.length > 0) ? cats.expense : DEFAULT_EXPENSE_CATS,
      nhap: (Array.isArray(cats?.nhap) && cats.nhap.length > 0) ? cats.nhap : DEFAULT_NHAP_CATS,
    };
    return result;
  };

  // Load categories from localStorage ngay khi mount (tránh hiển thị trống khi API lỗi)
  useEffect(() => {
    // ALWAYS use local categories - do NOT sync from server
    // Server has no reliable category data; categories are managed locally
    setCategories(loadSafeCategories());
  }, []);

  // Initialize from server and start real-time sync
  useEffect(() => {
    if (!user || !token) {
      // Not authenticated, skip
      return;
    }

    initializeStorage();
    
    // Reload categories AFTER initializeStorage to ensure they exist
    setCategories(loadSafeCategories());
    
    let serverSyncActive = false;
    
    // Kiểm tra: vừa full reset? → KHÔNG sync từ server (tránh thu chi ghi đè). Giữ flag 2 phút để callbacks cũng skip.
    // VITE_NO_SERVER_SYNC=true: Chỉ dùng localStorage, không fetch từ server (phù hợp npm run dev khi test)
    let skipAllServerSync = import.meta.env.VITE_NO_SERVER_SYNC === 'true';
    try {
      const resetTs = sessionStorage.getItem("finmaster_full_reset_ts");
      if (resetTs) {
        const age = Date.now() - parseInt(resetTs, 10);
        if (age < 120000) skipAllServerSync = true;
        if (age > 120000) sessionStorage.removeItem("finmaster_full_reset_ts");
      }
    } catch (_) {}
    
    // Initial sync from server (using static import - no dynamic import cache issues)
    serverSyncActive = true;

    Promise.all(
        skipAllServerSync
          ? [
              Promise.resolve().then(() => {
                setProducts(getProducts());
                setTransactions(getTransactions());
                setOrders(getOrders());
                setCustomers(getCustomers());
                setWallets(getWallets());
                setCategories(loadSafeCategories());
                setTemplates(getTemplates());
              }),
            ]
          : [
              syncProducts().then(data => {
                const list = Array.isArray(data) ? data : [];
                if (list.length > 0) {
                  mergeAndSetProducts(list);
                } else {
                  setProducts(getProducts());
                }
              }).catch(() => setProducts(getProducts())),
              syncTransactions().then(data => {
                const list = Array.isArray(data) ? data : [];
                const local = getTransactions();
                // Không ghi đè local bằng rỗng từ server (tránh mất dữ liệu)
                if (list.length > 0) {
                  setTransactionsData(list);
                  setTransactions(list);
                } else if (local.length > 0) {
                  setTransactions(local);
                } else {
                  setTransactionsData([]);
                  setTransactions([]);
                }
              }).catch(() => setTransactions(getTransactions())),
              syncOrders().then(data => {
                const list = Array.isArray(data) ? data : [];
                const local = getOrders();
                // Merge: giữ đơn local (ứng hàng) không có trên server - tránh mất dữ liệu
                if (list.length > 0) {
                  const serverIds = new Set(list.map((o) => String(o.id)));
                  const merged = [...list];
                  for (const o of local) {
                    if (!serverIds.has(String(o.id))) merged.push(o);
                  }
                  merged.sort((a, b) => (b.id || 0) - (a.id || 0));
                  setOrders(merged);
                } else if (local.length > 0) {
                  setOrders(local);
                } else {
                  setOrders([]);
                }
              }).catch(() => setOrders(getOrders())),
              syncCustomers().then(data => {
                if (data && Array.isArray(data) && data.length > 0) {
                  setCustomers(data);
                } else {
                  const local = getCustomers();
                  setCustomers(local?.length > 0 ? local : (data || []));
                }
              }).catch(() => setCustomers(getCustomers())),
              syncWallets().then(data => {
                if (data) setWallets(data);
              }).catch(() => setWallets(getWallets())),
              syncCategories().then(data => {
                // SKIP sync from server - categories are managed locally only
                // Server doesn't have reliable category data
                // Just ensure local data is loaded and set
                setCategories(loadSafeCategories());
              }).catch(() => {
                // Fallback to local if sync fails
                setCategories(loadSafeCategories());
              }),
              syncTemplates().then(data => {
                const list = Array.isArray(data) ? data : [];
                const local = getTemplates();
                if (list.length > 0) setTemplates(list);
                else if (local.length > 0) setTemplates(local);
                else setTemplates([]);
              }).catch(() => setTemplates(getTemplates())),
            ]
      ).then(() => {
        console.log('[HomePage] Initial server sync completed');
        maybeRecalcWalletsFromTransactions();
      }).catch(error => {
        console.error('[HomePage] Error during initial sync:', error);
        // Fallback to localStorage
        loadData();
      });

      // Start real-time sync
      startServerSync(token, {
        onConnect: () => {
          console.log('[HomePage] Server sync connected');
        },
        onError: (error) => {
          console.error('[HomePage] Server sync error:', error);
        },
        onAuthFailed: () => {
          console.warn('[HomePage] Auth failed (401), redirecting to login');
          logout?.();
          navigate('/login', { replace: true });
        },
        onProductUpdate: (type, payload) => {
          console.log('[HomePage] Product update:', type, payload);
          // CRITICAL: Kiểm tra userId trước khi sync để tránh ghi đè dữ liệu user cũ
          const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
          const currentUserId = currentUser?.id || currentUser?.userId;
          if (!currentUserId) {
            console.warn('[HomePage] No userId, skip product sync');
            return;
          }
          
          if (type === 'product_added' || type === 'product_updated') {
            syncProducts().then(data => {
              const list = Array.isArray(data) ? data : [];
              if (list.length > 0) {
                mergeAndSetProducts(list);
              } else {
                setProducts(getProducts());
              }
            }).catch(() => {
              if (payload && payload.id) {
                if (type === 'product_added') {
                  setProducts(prev => [...prev, payload]);
                } else {
                  setProducts(prev => prev.map(p => (
                    String(p.id) === String(payload.id) || (p.serverId && String(p.serverId) === String(payload.id))
                  ) ? { ...p, ...payload } : p));
                }
              } else {
                setProducts(getProducts());
              }
            });
          } else if (type === 'product_deleted') {
            setProducts(prev => prev.filter(p => String(p.id) !== String(payload.id) && (!p.serverId || String(p.serverId) !== String(payload.id))));
          }
        },
        onTransactionUpdate: (type, payload) => {
          console.log('[HomePage] Transaction update:', type, payload);
          // Vừa full reset (< 2 phút)? Không ghi đè từ server
          try {
            const resetTs = sessionStorage.getItem("finmaster_full_reset_ts");
            if (resetTs && (Date.now() - parseInt(resetTs, 10)) < 120000) return;
          } catch (_) {}
          // transaction_deleted: dùng filter local, KHÔNG gọi sync (tránh server trả [] làm mất hết)
          if (type === 'transaction_deleted' && payload?.id) {
            setTransactions(prev => prev.filter(t => String(t.id) !== String(payload.id)));
            return;
          }
          syncTransactions().then(data => {
            const list = Array.isArray(data) ? data : [];
            if (list.length > 0) {
              setTransactionsData(list);
              setTransactions(list);
            }
          }).catch(() => {
            if (payload?.id) {
              if (type === 'transaction_added') {
                setTransactions(prev => [...prev, payload]);
              } else if (type === 'transaction_updated') {
                setTransactions(prev => prev.map(t => t.id === payload.id ? payload : t));
              }
            }
          });
        },
        onOrderUpdate: (type, payload) => {
          console.log('[HomePage] Order update:', type, payload);
          syncOrders().then(data => {
            const list = Array.isArray(data) ? data : [];
            const local = getOrders();
            if (list.length > 0) {
              const serverIds = new Set(list.map((o) => String(o.id)));
              const merged = [...list];
              for (const o of local) {
                if (!serverIds.has(String(o.id))) merged.push(o);
              }
              merged.sort((a, b) => (b.id || 0) - (a.id || 0));
              setOrders(merged);
            }
          }).catch(() => {
            if (payload && payload.id) {
              if (type === 'order_added') {
                setOrders(prev => [...prev, payload]);
              } else if (type === 'order_updated') {
                setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
              } else if (type === 'order_deleted') {
                setOrders(prev => prev.filter(o => o.id !== payload.id));
              }
            }
          });
        },
        onCustomerUpdate: (type, payload) => {
          console.log('[HomePage] Customer update:', type, payload);
          syncCustomers().then(data => {
            const list = Array.isArray(data) ? data : [];
            if (list.length > 0) setCustomers(list);
          }).catch(() => {
            if (payload && payload.id) {
              if (type === 'customer_added') {
                setCustomers(prev => [...prev, payload]);
              } else if (type === 'customer_updated') {
                setCustomers(prev => prev.map(c => c.id === payload.id ? payload : c));
              } else if (type === 'customer_deleted') {
                setCustomers(prev => prev.filter(c => c.id !== payload.id));
              }
            }
          });
        },
      });

    // CRITICAL: Start User ID Guard để bảo vệ multi-user
    startUserIdGuard();

    // Cleanup function - always stop ServerSync when auth changes or unmount
    let cleanupCalled = false;
    const cleanup = () => {
      if (cleanupCalled) return;
      cleanupCalled = true;
      if (typeof window !== "undefined") {
        stopServerSync();
        stopUserIdGuard();
      }
    };
    
    return cleanup;
  }, [user?.id, token]);

  // Load from localStorage on mount (fallback) - only if not authenticated
  useEffect(() => {
    if (!user && !authLoading) {
      loadData();
    }
  }, [authLoading]);

  /** Tính ví từ giao dịch. Ứng hàng: không trừ ví (chỉ theo dõi hàng/tiền). */
  const calculateWalletsFromTransactions = (txList) => {
    let cash = 0, bank = 0;
    (txList || []).forEach((t) => {
      const wallet = t.wallet === "bank" ? "bank" : "cash";
      const amount = Number(t.amount) || 0;
      if (t.type === "income" || t.type === "nhap") {
        if (wallet === "bank") bank += amount;
        else cash += amount;
      } else if (t.type === "expense" || t.type === "debt_payment") {
        if (t.category === "Ứng hàng chưa thu") return;
        if (wallet === "bank") bank -= amount;
        else cash -= amount;
      }
    });
    return { cash, bank };
  };

  /** Tự động tính lại ví nếu sai lệch với tổng từ giao dịch (fix sau F5/đăng nhập). */
  const maybeRecalcWalletsFromTransactions = () => {
    const txList = getTransactions();
    const expected = calculateWalletsFromTransactions(txList);
    const current = getWallets();
    const mismatch =
      Math.abs((current?.cash ?? 0) - expected.cash) > 1 ||
      Math.abs((current?.bank ?? 0) - expected.bank) > 1;
    if (mismatch) {
      updateWallets(expected);
      setWallets(expected);
    }
  };

  /** Merge sản phẩm từ server với local để đồng bộ serverId và tránh ghi đè sai. */
  const mergeAndSetProducts = (serverList = []) => {
    const normalizeName = (p) => String(p?.name || p?.productName || '').trim().toLowerCase();

    const normalizedServer = (Array.isArray(serverList) ? serverList : [])
      .filter(Boolean)
      .map((p) => ({
        ...p,
        id: p?.id ?? p?.serverId ?? p?._id,
        serverId: p?.id ?? p?.serverId ?? p?._id ?? p?.id,
        updatedAt: p?.updatedAt ? new Date(p.updatedAt).getTime() : Date.now(),
      }))
      .filter((p) => p.id || p.serverId);

    const local = getProducts();
    const localByName = new Map();
    local.forEach((lp) => {
      const key = normalizeName(lp);
      if (key && !localByName.has(key)) localByName.set(key, lp);
    });

    const matchedLocalIds = new Set();
    const merged = normalizedServer.map((sp) => {
      const key = normalizeName(sp);
      const localMatch = key ? localByName.get(key) : null;
      if (localMatch) {
        matchedLocalIds.add(localMatch.id);
        return {
          ...localMatch,
          ...sp,
          id: sp.id ?? sp.serverId ?? localMatch.id,
          serverId: sp.serverId ?? sp.id ?? localMatch.serverId ?? localMatch.id,
          updatedAt: sp.updatedAt || Date.now(),
        };
      }
      return {
        ...sp,
        id: sp.id ?? sp.serverId,
        serverId: sp.serverId ?? sp.id,
      };
    });

    local.forEach((lp) => {
      if (!matchedLocalIds.has(lp.id)) merged.push(lp);
    });

    setProductsData(merged);
    const deduped = getProducts();
    setProducts(deduped);
    return deduped;
  };

  const loadData = () => {
    try {
      setTransactions(getTransactions());
      setOrders(getOrders());
      setProducts(getProducts());
      setCategories(loadSafeCategories());
      setTemplates(getTemplates());
      setCustomers(getCustomers());
      setWallets(getWallets());
      maybeRecalcWalletsFromTransactions();
    } catch (error) {
      console.error('[HomePage] Error loading data:', error);
    }
  };

  // Wallet handlers
  const handleUpdateWallets = (newWallets) => {
    updateWallets(newWallets);
    setWallets(newWallets);
  };

  // Transaction handlers (with server sync)
  const handleAddTransaction = async (transaction) => {
    try {
      const newTransaction = await apiAddTransaction(transaction);
      setTransactions([...getTransactions()]);
      return newTransaction;
    } catch (error) {
      console.error('[HomePage] Error adding transaction:', error);
      // Fallback: still update UI even if server sync fails
      setTransactions([...getTransactions()]);
      return null;
    }
  };

  const handleUpdateTransaction = async (id, updates) => {
    try {
      await apiUpdateTransaction(id, updates);
      setTransactions([...getTransactions()]);
    } catch (error) {
      console.error('[HomePage] Error updating transaction:', error);
      // Fallback: still update UI
      setTransactions([...getTransactions()]);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await apiDeleteTransaction(id);
      setTransactions([...getTransactions()]);
    } catch (error) {
      console.error('[HomePage] Error deleting transaction:', error);
      // Fallback: still update UI
      setTransactions([...getTransactions()]);
    }
  };

  // Order handlers
  const handleAddOrder = (order) => {
    const newOrder = addOrder(order);
    setOrders([...getOrders()]);
    return newOrder;
  };

  const handleUpdateOrder = (orderId, updates) => {
    const updated = updateOrder(orderId, updates);
    if (updated) setOrders([...getOrders()]);
    return updated;
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này? Số lượng sản phẩm sẽ được trả lại vào kho.")) {
      return;
    }

    // Get order to restore quantities
    const orders = getOrders();
    const orderToDelete = orders.find((o) => o.id === orderId);
    
    if (!orderToDelete) {
      alert("Không tìm thấy đơn hàng!");
      return;
    }

    // Restore product quantities to inventory
    if (orderToDelete.items && Array.isArray(orderToDelete.items)) {
      // Aggregate by product id: same product in multiple lines must sum quantities
      const quantityByProductId = new Map();
      for (const item of orderToDelete.items) {
        const productId = item.id;
        const quantity = parseFloat(item.quantity) || 0;
        quantityByProductId.set(
          productId,
          (quantityByProductId.get(productId) || 0) + quantity
        );
      }

      // Update each product's quantity
      const productUpdates = [];
      for (const [productId, totalQuantity] of quantityByProductId) {
        const product = products.find((p) => p.id === productId);
        if (product && handleUpdateProduct) {
          const currentQuantity = parseFloat(product.quantity) || 0;
          const newQuantity = currentQuantity + totalQuantity;
          productUpdates.push({ id: product.id, quantity: newQuantity });
        }
      }

      // Update all products
      if (productUpdates.length > 0) {
        await Promise.all(
          productUpdates.map((u) =>
            Promise.resolve(handleUpdateProduct(u.id, { quantity: u.quantity }))
          )
        );
        // Reload products to reflect changes
        setProducts([...getProducts()]);
      }
    }

    // Delete linked transaction if exists
    if (orderToDelete.id) {
      const linkedTransaction = transactions.find(
        (t) => t.linkedOrderId === orderToDelete.id
      );
      if (linkedTransaction && handleDeleteTransaction) {
        // Reverse wallet changes first
        const newWallets = { ...wallets };
        if (linkedTransaction.type === "income" || linkedTransaction.type === "nhap") {
          newWallets[linkedTransaction.wallet] -= linkedTransaction.amount;
          handleUpdateWallets(newWallets);
        }
        // Delete transaction
        await handleDeleteTransaction(linkedTransaction.id);
      }
    }

    // Delete order
    deleteOrder(orderId);
    setOrders([...getOrders()]);

    alert("✅ Đã xóa đơn hàng và trả lại số lượng sản phẩm vào kho!");
  };

  // Product handlers (with server sync)
  const handleAddProduct = async (product) => {
    try {
      await apiAddProduct(product);
      setProducts([...getProducts()]);
    } catch (error) {
      console.error('[HomePage] Error adding product:', error);
      // Fallback: still update UI even if server sync fails
      setProducts([...getProducts()]);
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    try {
      await apiUpdateProduct(id, updates);
      // Force reload from localStorage to ensure consistency
      const updatedProducts = getProducts();
      setProducts([...updatedProducts]);
    } catch (error) {
      console.error('[HomePage] Error updating product:', error);
      // Fallback: still update UI
      const updatedProducts = getProducts();
      setProducts([...updatedProducts]);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await apiDeleteProduct(id);
        setProducts([...getProducts()]);
      } catch (error) {
        console.error('[HomePage] Error deleting product:', error);
        // Fallback: still update UI
        setProducts([...getProducts()]);
      }
    }
  };

  // Category handlers
  const handleAddCategory = (category) => {
    const result = addCategory(category);
    if (result) {
      setCategories(loadSafeCategories());
    }
  };

  const handleDeleteCategory = (id, type) => {
    deleteCategory(id, type);
    setCategories(loadSafeCategories());
  };

  // Template handlers
  const handleSaveTemplate = (template) => {
    addTemplate(template);
    setTemplates([...getTemplates()]);
  };

  // Customer handlers
  const handleAddCustomer = (customer) => {
    const newCustomer = addCustomer(customer);
    setCustomers([...getCustomers()]);
    return newCustomer;
  };

  const handleUpdateCustomer = (id, updates) => {
    updateCustomer(id, updates);
    setCustomers([...getCustomers()]);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa khách hàng này?")) {
      deleteCustomer(id);
      setCustomers([...getCustomers()]);
    }
  };

  const renderModule = () => {
    switch (activeModule) {
      case "wallets":
        return (
          <WalletsModule
            key={dataResetKey}
            wallets={wallets}
            onUpdateWallets={handleUpdateWallets}
            onAddTransaction={handleAddTransaction}
            products={products}
            transactions={transactions}
            orders={orders}
          />
        );
      case "orders":
        return (
          <OrdersModule
            key={dataResetKey}
            products={products}
            templates={templates}
            customers={customers}
            wallets={wallets}
            transactions={transactions}
            orders={orders}
            onAddOrder={handleAddOrder}
            onDeleteOrder={handleDeleteOrder}
            onSaveTemplate={handleSaveTemplate}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onUpdateWallets={handleUpdateWallets}
          />
        );
      case "ledger":
        return (
          <CashflowLedgerModule
            key={dataResetKey}
            transactions={transactions}
            orders={orders}
            categories={categories}
            wallets={wallets}
            customers={customers}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onUpdateWallets={handleUpdateWallets}
            onUpdateOrder={handleUpdateOrder}
          />
        );
      case "reports":
        return (
          <ReportsModule 
            key={dataResetKey}
            transactions={transactions} 
            orders={orders}
            wallets={wallets}
            customers={customers}
          />
        );
      case "telegram":
        return (
          <TelegramChatModule key={dataResetKey} />
        );
      case "settings":
        return (
          <SettingsModule
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetData={async (mode = "full") => {
              await apiResetAllData(mode);
              setDataResetKey((k) => k + 1);
              if (mode === "full") {
                // Reset toàn bộ: cập nhật state rỗng
                setWallets({ cash: 0, bank: 0 });
                setTransactions([]);
                setOrders([]);
                setProducts([]);
                setCustomers([]);
                setTemplates([]);
                // Reload trang để đảm bảo không còn dữ liệu cũ từ cache/sync
                window.location.reload();
                return;
              }
              // Reset một phần: cập nhật những gì đã xóa
              setWallets({ cash: 0, bank: 0 });
              setTransactions([]);
              setOrders([]);
              setProducts(getProducts());
              setCustomers(getCustomers());
              loadData();
            }}
          />
        );
      case "admin":
        return (
          <AdminModule key={dataResetKey} />
        );
      default:
        return (
          <WalletsModule
            key={dataResetKey}
            wallets={wallets}
            onUpdateWallets={handleUpdateWallets}
            onAddTransaction={handleAddTransaction}
            products={products}
            transactions={transactions}
            orders={orders}
          />
        );
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deepSlate-900 dark:bg-deepSlate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-deepSlate-400 dark:text-deepSlate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deepSlate-900 dark:bg-deepSlate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-deepSlate-400 dark:text-deepSlate-400">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-deepSlate-900 dark:bg-deepSlate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CashflowSidebar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black opacity-50 dark:opacity-70"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 h-screen bg-deepSlate-800 dark:bg-deepSlate-800 shadow-xl border-r border-deepSlate-700">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-deepSlate-400 hover:text-deepSlate-200 dark:text-deepSlate-400 dark:hover:text-deepSlate-200"
              >
                <X size={24} />
              </button>
            </div>
            <CashflowSidebar
              activeModule={activeModule}
              onModuleChange={(module) => {
                setActiveModule(module);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-deepSlate-800 dark:bg-deepSlate-800 border-b border-deepSlate-700 p-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-deepSlate-400 dark:text-deepSlate-400 hover:text-deepSlate-200 dark:hover:text-deepSlate-200 hover:bg-deepSlate-700 dark:hover:bg-deepSlate-700 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-bold text-deepSlate-50 dark:text-deepSlate-50">
            Bài Toán Của Sự Giàu Có
          </h1>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto bg-deepSlate-900 text-deepSlate-50">{renderModule()}</div>
      </div>

      {/* Chat Support Widget - nằm trên tất cả các module */}
      <ChatSupportModule />
    </div>
  );
}

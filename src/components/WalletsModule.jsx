import { useState, useEffect, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, X, Package, Target, Calendar, DollarSign, Edit2, Save, ShoppingBag } from "lucide-react";
import { getProducts, getTransactions, updateProduct, getOrders, getDebts, toLocalDateStr } from "@/utils/localStorage";
import { useTheme } from "@/contexts/ThemeContext";

export default function WalletsModule({
  wallets,
  onUpdateWallets,
  onAddTransaction,
  products = [],
  transactions = [],
  orders = [],
}) {
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileWallet, setReconcileWallet] = useState(null);
  const [actualAmount, setActualAmount] = useState("");
  const [showInventoryReconcileModal, setShowInventoryReconcileModal] = useState(false);
  const [inventoryActualQuantities, setInventoryActualQuantities] = useState({});
  // Get current user ID for storage keys
  const getCurrentUserId = () => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user?.id || null;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  };

  const getTargetStorageKey = (baseKey) => {
    const userId = getCurrentUserId();
    return userId ? `${baseKey}_user_${userId}` : baseKey;
  };

  const [targetEarnings, setTargetEarnings] = useState(() => {
    const saved = localStorage.getItem(getTargetStorageKey('finmaster_target_earnings'));
    return saved ? parseFloat(saved) : 0;
  });
  const [targetDays, setTargetDays] = useState(() => {
    const saved = localStorage.getItem(getTargetStorageKey('finmaster_target_days'));
    return saved ? parseFloat(saved) : 0;
  });
  const [isCalculating, setIsCalculating] = useState(false);
  // Track xem đã lưu mục tiêu chưa (nếu có cả targetDays và targetEarnings thì coi như đã lưu)
  const [isTargetSaved, setIsTargetSaved] = useState(() => {
    const savedEarnings = localStorage.getItem(getTargetStorageKey('finmaster_target_earnings'));
    const savedDays = localStorage.getItem(getTargetStorageKey('finmaster_target_days'));
    return savedEarnings && savedDays && parseFloat(savedEarnings) > 0 && parseFloat(savedDays) > 0;
  });
  const [tmdtProfitPeriod, setTmdtProfitPeriod] = useState('month'); // day, week, month, 90days

  // Load products and transactions if not provided
  const [localProducts, setLocalProducts] = useState(products);
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [localOrders, setLocalOrders] = useState(orders);

  const { currentTheme } = useTheme();

  useEffect(() => {
    // Luôn sync với localStorage khi prop rỗng (sau reset)
    // Luôn đọc lại từ localStorage để đảm bảo tiền hàng được cập nhật khi có ứng hàng
    const latestProducts = getProducts();
    setLocalProducts(products && products.length > 0 ? products : latestProducts);
    setLocalTransactions(transactions && transactions.length > 0 ? transactions : getTransactions());
    setLocalOrders(orders && orders.length > 0 ? orders : getOrders());
  }, [products, transactions, orders]);

  const formatVND = (amount) => {
    const n = Number(amount);
    if (n == null || Number.isNaN(n)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  };

  // Luôn tính ví từ giao dịch trong Sổ Thu Chi (không cần bấm "Tính lại")
  // income và nhap đều cộng vào ví; expense/debt_payment trừ
  // Ứng hàng: hàng đang giữ, chắc chắn trả tiền/hàng → KHÔNG trừ ví (chỉ theo dõi)
  const calculatedFromTx = (() => {
    const txList = getTransactions();
    let cash = 0,
      bank = 0;
    txList.forEach((t) => {
      const wallet = t.wallet === "bank" ? "bank" : "cash";
      const amount = Number(t.amount) || 0;
      if (t.type === "income" || t.type === "nhap") {
        if (wallet === "bank") bank += amount;
        else cash += amount;
      } else if (t.type === "expense" || t.type === "debt_payment") {
        if (t.category === "Ứng hàng chưa thu") return; // không trừ ví
        if (wallet === "bank") bank -= amount;
        else cash -= amount;
      }
    });
    return { cash, bank };
  })();

  const totalBalance = calculatedFromTx.cash + calculatedFromTx.bank;

  // Đồng bộ ví hiển thị với tổng từ giao dịch (để các module khác dùng đúng)
  useEffect(() => {
    const mismatch =
      Math.abs((wallets?.cash ?? 0) - calculatedFromTx.cash) > 1 ||
      Math.abs((wallets?.bank ?? 0) - calculatedFromTx.bank) > 1;
    if (mismatch && onUpdateWallets) {
      onUpdateWallets(calculatedFromTx);
    }
  }, [calculatedFromTx.cash, calculatedFromTx.bank, wallets?.cash, wallets?.bank, onUpdateWallets]);

  // Calculate Inventory Value (Tiền Hàng) - Recalculate khi localProducts thay đổi
  // Tiền hàng = tổng (số lượng × giá vốn) của tất cả sản phẩm trong kho
  // Khi ứng hàng, số lượng bị trừ → tiền hàng tự động giảm
  const inventoryValue = useMemo(() => {
    return localProducts.reduce((total, product) => {
      const quantity = product.quantity || 0;
      const cost = product.cost || product.price * 0.6; // Default cost is 60% of price
      return total + (quantity * cost);
    }, 0);
  }, [localProducts]);

  // Calculate Total Debt to Pay (Tổng nợ cần trả) from debts table
  const calculateTotalDebt = () => {
    const debts = getDebts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let totalDebt = 0;
    
    debts.forEach((debt) => {
      const startDate = new Date(debt.startDate);
      const recurringDay = debt.recurringDay;

      debt.monthlyPayments.forEach((payment) => {
        // Skip if already paid
        if (payment.paid) return;

        // Calculate due date for this month
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (payment.monthIndex - 1));
        dueDate.setDate(recurringDay);
        
        // Adjust if day doesn't exist in that month
        const daysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
        if (recurringDay > daysInMonth) {
          dueDate.setDate(daysInMonth);
        }

        const dueDateObj = new Date(dueDate);
        dueDateObj.setHours(0, 0, 0, 0);

        // Only count if due date is today or in the future
        if (dueDateObj >= today) {
          totalDebt += payment.principal + payment.interest;
        }
      });
    });
    
    return totalDebt;
  };

  const totalDebt = calculateTotalDebt();

  // Calculate TMDT Pending Amount (Số tiền tạm đoán từ các sàn TMĐT)
  const calculateTMDTPendingAmount = () => {
    const tmdtOrders = localOrders.filter(order => {
      const paymentMethod = order.paymentMethod || '';
      return paymentMethod === 'tiktok' || paymentMethod === 'shopee' || paymentMethod === 'ecommerce';
    });

    const totalByPlatform = {
      tiktok: 0,
      shopee: 0,
      ecommerce: 0,
      total: 0
    };

    tmdtOrders.forEach(order => {
      const revenue = order.revenue || 0;
      const paymentMethod = order.paymentMethod || '';
      
      if (paymentMethod === 'tiktok') {
        totalByPlatform.tiktok += revenue;
      } else if (paymentMethod === 'shopee') {
        totalByPlatform.shopee += revenue;
      } else if (paymentMethod === 'ecommerce') {
        totalByPlatform.ecommerce += revenue;
      }
      
      totalByPlatform.total += revenue;
    });

    return totalByPlatform;
  };

  const tmdtPending = calculateTMDTPendingAmount();

  // Calculate TMDT Profit by period
  const calculateTMDTProfit = () => {
    const now = new Date();
    let startDate = new Date();

    switch (tmdtProfitPeriod) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredOrders = localOrders.filter(order => {
      const paymentMethod = order.paymentMethod || '';
      if (paymentMethod !== 'tiktok' && paymentMethod !== 'shopee' && paymentMethod !== 'ecommerce') {
        return false;
      }

      // Check order date
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(order.id); // Use createdAt or id (timestamp) as fallback
      return orderDate >= startDate && orderDate <= now;
    });

    const profitByPlatform = {
      tiktok: { revenue: 0, cost: 0, profit: 0 },
      shopee: { revenue: 0, cost: 0, profit: 0 },
      ecommerce: { revenue: 0, cost: 0, profit: 0 },
      total: { revenue: 0, cost: 0, profit: 0 }
    };

    filteredOrders.forEach(order => {
      const revenue = order.revenue || 0;
      const cost = order.cost || 0;
      const profit = order.profit || (revenue - cost);
      const paymentMethod = order.paymentMethod || '';

      if (paymentMethod === 'tiktok') {
        profitByPlatform.tiktok.revenue += revenue;
        profitByPlatform.tiktok.cost += cost;
        profitByPlatform.tiktok.profit += profit;
      } else if (paymentMethod === 'shopee') {
        profitByPlatform.shopee.revenue += revenue;
        profitByPlatform.shopee.cost += cost;
        profitByPlatform.shopee.profit += profit;
      } else if (paymentMethod === 'ecommerce') {
        profitByPlatform.ecommerce.revenue += revenue;
        profitByPlatform.ecommerce.cost += cost;
        profitByPlatform.ecommerce.profit += profit;
      }

      profitByPlatform.total.revenue += revenue;
      profitByPlatform.total.cost += cost;
      profitByPlatform.total.profit += profit;
    });

    return profitByPlatform;
  };

  const tmdtProfit = calculateTMDTProfit();

  const normalizeTxDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
      const m = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = Number(m[3]);
        const d = new Date(year, month - 1, day);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
    if (typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // ===============================
  // LOGIC MỚI: SỐ TIỀN LỜI
  // ===============================
  // Ô 1: "Số tiền lời trong ngày"
  // - Nguồn: Tất cả giao dịch "Thu" (income) trong "Sổ thu chi"
  // - Tính lời cho TẤT CẢ giao dịch: Lời = Thu - Vốn
  // - Nếu không có vốn (cost = 0): Lời = 100% số tiền thu (amount)
  // - Reset mỗi 0h (chỉ tính trong ngày hôm nay)
  //
  // Ô 2: "Số tiền lời trong tháng"
  // - Tổng "Số tiền lời trong ngày" từ ngày 1 → ngày cuối tháng hiện tại
  const calculateProfitFromTransactions = () => {
    const txList = localTransactions?.length > 0 ? localTransactions : getTransactions();
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const dailyProfit = {};

    // Lọc tất cả giao dịch THU (income)
    const incomeTransactions = (txList || []).filter(t => t.type === 'income');

    incomeTransactions.forEach(t => {
      const dateObj = normalizeTxDate(t.date || t.createdAt || t.updatedAt || t.id);
      if (!dateObj) return;
      if (dateObj.getFullYear() !== currentYear || dateObj.getMonth() !== currentMonth) return;

      const dateStr = toLocalDateStr(dateObj);
      const amount = Number(t.amount) || 0;
      const cost = Number(t.cost) || 0; // Giá vốn (nếu có)

      // Tính lời cho tất cả giao dịch: Lời = Thu - Vốn (vốn mặc định = 0)
      const profit = amount - cost;
      if (!dailyProfit[dateStr]) dailyProfit[dateStr] = 0;
      dailyProfit[dateStr] += profit;
    });

    const todayProfit = dailyProfit[todayStr] ?? 0;
    const totalMonthProfit = Object.values(dailyProfit).reduce((s, v) => s + (Number(v) || 0), 0);

    return {
      todayProfit: Number.isFinite(todayProfit) ? todayProfit : 0,
      totalMonthProfit: Number.isFinite(totalMonthProfit) ? totalMonthProfit : 0,
      dailyProfit,
    };
  };

  const profitFromTransactions = calculateProfitFromTransactions();

  // ===============================
  // LOGIC MỚI: SỐ THỰC VỀ THU CHI
  // ===============================
  // Ô 1: "TB ngày lợi nhuận"
  // - = "Số tiền lời trong ngày" (từ phần trên) - Chi trong "Sổ thu chi" (không tính Ứng hàng)
  //
  // Ô 2: "TB Tháng Lợi Nhuận"
  // - = Tổng "TB ngày lợi nhuận" từ ngày 1 → ngày cuối tháng
  const calculateActualNetProfit = () => {
    const txList = localTransactions?.length > 0 ? localTransactions : getTransactions();
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Lọc giao dịch CHI (expense) - Ứng hàng có type='ung_hang' nên tự động loại trừ
    const expenseTransactions = (txList || []).filter(
      t => t.type === 'expense'
    );

    const dailyExpense = {};
    expenseTransactions.forEach(t => {
      const dateObj = normalizeTxDate(t.date || t.createdAt || t.updatedAt || t.id);
      if (!dateObj) return;
      if (dateObj.getFullYear() !== currentYear || dateObj.getMonth() !== currentMonth) return;

      const dateStr = toLocalDateStr(dateObj);
      if (!dailyExpense[dateStr]) dailyExpense[dateStr] = 0;
      dailyExpense[dateStr] += Number(t.amount) || 0;
    });

    // Tính "TB ngày lợi nhuận" = Chỉ lợi nhuận thực từ giao dịch income (không trừ expense)
    // Expense được hiển thị riêng ở "Số thực về thu chi" = Lợi nhuận - Chi phí
    // "Lợi Nhuận Hôm Nay" = chỉ tính từ income transactions (không âm)
    const dailyProfitFromTx = profitFromTransactions.dailyProfit || {};
    const dailyNetProfit = {};
    
    // "Lợi Nhuận Hôm Nay" = lợi nhuận thực từ income (chỉ positive hoặc 0)
    // "Số thực về thu chi" = lợi nhuận - chi phí (có thể negative)
    Object.keys(dailyProfitFromTx).forEach(dateStr => {
      dailyNetProfit[dateStr] = dailyProfitFromTx[dateStr] || 0;
    });

    const todayNetProfit = dailyNetProfit[todayStr] ?? 0;
    const totalMonthNetProfit = Object.values(dailyNetProfit).reduce((s, v) => s + (Number(v) || 0), 0);

    return {
      todayNetProfit: Number.isFinite(todayNetProfit) ? todayNetProfit : 0,
      totalMonthNetProfit: Number.isFinite(totalMonthNetProfit) ? totalMonthNetProfit : 0,
      dailyNetProfit,
      dailyExpense,
    };
  };

  const actualNetProfit = calculateActualNetProfit();

  // Calculate debt for current month (nợ cần trả trong tháng hiện tại)
  const calculateCurrentMonthDebt = () => {
    const debts = getDebts();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    today.setHours(0, 0, 0, 0);
    
    let currentMonthDebt = 0;
    
    debts.forEach((debt) => {
      const startDate = new Date(debt.startDate);
      const recurringDay = debt.recurringDay;

      debt.monthlyPayments.forEach((payment) => {
        if (payment.paid) return;

        // Calculate due date for this month
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (payment.monthIndex - 1));
        dueDate.setDate(recurringDay);
        
        const daysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
        if (recurringDay > daysInMonth) {
          dueDate.setDate(daysInMonth);
        }

        const dueDateObj = new Date(dueDate);
        dueDateObj.setHours(0, 0, 0, 0);

        // Check if this debt is due in current month
        if (dueDateObj.getMonth() === currentMonth && 
            dueDateObj.getFullYear() === currentYear &&
            dueDateObj >= today) {
          currentMonthDebt += payment.principal + payment.interest;
        }
      });
    });
    
    return currentMonthDebt;
  };

  const currentMonthDebt = calculateCurrentMonthDebt();

  // Calculate days to pay off all debts (số ngày dự kiến trả xong nợ)
  const calculateDaysToPayOffDebt = () => {
    if (actualNetProfit.todayNetProfit <= 0) {
      return Infinity; // Không thể trả nợ nếu chi > thu
    }
    if (totalDebt <= 0) {
      return 0; // Không có nợ
    }
    return Math.ceil(totalDebt / actualNetProfit.todayNetProfit);
  };

  const daysToPayOffDebt = calculateDaysToPayOffDebt();

  // Calculate remaining after paying current month debt
  const remainingAfterCurrentMonthDebt = (profitFromTransactions.totalMonthProfit ?? 0) - currentMonthDebt;

  // Save target earnings and days to localStorage
  useEffect(() => {
    if (targetEarnings > 0) {
      localStorage.setItem(getTargetStorageKey('finmaster_target_earnings'), targetEarnings.toString());
    }
  }, [targetEarnings]);

  useEffect(() => {
    if (targetDays > 0) {
      localStorage.setItem(getTargetStorageKey('finmaster_target_days'), targetDays.toString());
    }
  }, [targetDays]);

  // Lưu lại mục tiêu
  const handleSaveTarget = () => {
    if (targetDays > 0 && targetEarnings > 0) {
      setIsCalculating(true);
      setIsCalculating(false);
      setIsTargetSaved(true);
      alert("✅ Đã lưu mục tiêu!");
    } else {
      alert("⚠️ Vui lòng nhập đầy đủ 'Số tiền muốn kiếm' và 'Số ngày muốn kiếm'!");
    }
  };

  // ===============================
  // LOGIC MỚI: SỐ TIỀN MUỐN KIẾM
  // ===============================
  // Ô 1: "TB ngày lợi nhuận"
  // - = "TB ngày lợi nhuận" (từ Số Thực) - "TB ngày cần đạt" (từ mục tiêu)
  //
  // Ô 2: BỎ "TB Tháng lợi nhuận"
  //
  // Ô 3: "Số ngày dự kiến đạt mục tiêu"
  // - Dựa vào "TB ngày lợi nhuận" so với "TB ngày cần đạt"
  // - Nếu dương: màu xanh lá đậm, hiện số ngày còn lại
  // - Nếu âm: hiện số ngày cần thêm (số âm)
  const calculateTargetStats = () => {
    if (targetDays <= 0 || targetEarnings <= 0) {
      return {
        dailyTargetRequired: 0,
        dailyNetProfitVsTarget: 0,
        estimatedDaysToTarget: 0,
        achievementRate: 0,
        remainingEarnings: targetEarnings,
        remainingDays: targetDays,
        status: 'not-set' // not-set, on-track, ahead, behind, unachievable
      };
    }

    const dailyTargetRequired = targetEarnings / targetDays;
    const todayNetProfit = actualNetProfit.todayNetProfit;
    const dailyNetProfitVsTarget = todayNetProfit - dailyTargetRequired;
    
    // Tính tỷ lệ đạt mục tiêu % (dựa trên lợi nhuận thực tế hôm nay vs mục tiêu hôm nay)
    const achievementRate = dailyTargetRequired > 0 ? (todayNetProfit / dailyTargetRequired) * 100 : 0;
    
    // Số tiền còn lại cần kiếm (nếu kiếm được như hôm nay mỗi ngày)
    const remainingEarnings = Math.max(0, targetEarnings - (todayNetProfit || 0));
    
    // Số ngày dự kiến đạt mục tiêu
    let estimatedDaysToTarget = 0;
    let status = 'on-track';
    
    if (todayNetProfit > 0) {
      estimatedDaysToTarget = remainingEarnings / todayNetProfit;
      
      if (estimatedDaysToTarget <= targetDays) {
        status = 'on-track'; // Có thể đạt trong thời gian
        if (estimatedDaysToTarget <= targetDays * 0.8) {
          status = 'ahead'; // Sắp đạt (sớm hơn 20%)
        }
      } else {
        status = 'behind'; // Cần thêm thời gian
      }
    } else if (todayNetProfit <= 0) {
      estimatedDaysToTarget = -Infinity;
      status = 'unachievable'; // Không thể đạt
    }

    return {
      dailyTargetRequired: Number.isFinite(dailyTargetRequired) ? dailyTargetRequired : 0,
      dailyNetProfitVsTarget: Number.isFinite(dailyNetProfitVsTarget) ? dailyNetProfitVsTarget : 0,
      estimatedDaysToTarget: Number.isFinite(estimatedDaysToTarget) ? estimatedDaysToTarget : -Infinity,
      achievementRate: Number.isFinite(achievementRate) ? Math.round(achievementRate) : 0,
      remainingEarnings: remainingEarnings,
      remainingDays: Math.ceil(targetDays - 0), // Đơn giản: ngày hiện tại tính từ ngày 1
      status: status
    };
  };

  const targetStats = calculateTargetStats();

  // Reset target earnings and days
  const handleResetTarget = () => {
    if (window.confirm("Bạn có chắc muốn làm mới? Tất cả dữ liệu sẽ được reset về 0.")) {
      setTargetEarnings(0);
      setTargetDays(0);
      setIsTargetSaved(false); // Cho phép sửa lại
      localStorage.removeItem(getTargetStorageKey('finmaster_target_earnings'));
      localStorage.removeItem(getTargetStorageKey('finmaster_target_days'));
    }
  };


  // Bỏ logic cũ - đã tích hợp vào calculateTargetStats

  const handleReconcileClick = (walletType) => {
    setReconcileWallet(walletType);
    setActualAmount("");
    setShowReconcileModal(true);
  };

  const handleReconcile = () => {
    const actual = parseFloat(actualAmount) || 0;
    const walletName = reconcileWallet === "cash" ? "Tiền mặt" : "Ngân hàng";
    const systemBalance = calculatedFromTx[reconcileWallet] ?? 0;
    const difference = systemBalance - actual;

    // Cảnh báo nếu số tiền quá lớn (có thể nhập nhầm)
    if (actual > 1e12) {
      if (
        !window.confirm(
          `Số tiền ${formatVND(actual)} rất lớn (> 1.000 tỷ). Bạn có chắc đúng không?`
        )
      ) {
        return;
      }
    }

    if (difference === 0) {
      alert("Số dư khớp chính xác! Không cần điều chỉnh.");
      setShowReconcileModal(false);
      return;
    }

    // Update wallet to actual amount
    const newWallets = {
      ...wallets,
      [reconcileWallet]: actual,
    };
    onUpdateWallets(newWallets);

    // Auto-generate adjustment transaction
    if (difference > 0) {
      // System > Actual: Money is missing (Expense)
      onAddTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: difference,
        wallet: reconcileWallet,
        category: "Thất thoát không rõ nguyên nhân",
        note: `So khớp quỹ ${walletName}: Hệ thống ${formatVND(systemBalance)}, Thực tế ${formatVND(actual)}`,
        isReconciliation: true,
      });
    } else {
      // System < Actual: Extra money (Income)
      onAddTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "income",
        amount: Math.abs(difference),
        wallet: reconcileWallet,
        category: "Điều chỉnh thừa",
        note: `So khớp quỹ ${walletName}: Hệ thống ${formatVND(systemBalance)}, Thực tế ${formatVND(actual)}`,
        isReconciliation: true,
      });
    }

    setShowReconcileModal(false);
  };

  // Handle inventory reconciliation
  const handleInventoryReconcile = () => {
    let hasDifference = false;
    let totalAdjustmentAmount = 0;
    const adjustments = [];

    // Check each product
    localProducts.forEach(product => {
      const systemQuantity = product.quantity || 0;
      const actualQuantity = parseFloat(inventoryActualQuantities[product.id]) || 0;
      const difference = systemQuantity - actualQuantity;

      if (difference !== 0) {
        hasDifference = true;
        const cost = product.cost || product.price * 0.6;
        const adjustmentAmount = Math.abs(difference) * cost;

        // Update product quantity
        updateProduct(product.id, { quantity: actualQuantity });

        // If missing inventory (system > actual) → Create expense transaction
        if (difference > 0) {
          totalAdjustmentAmount += adjustmentAmount;
          adjustments.push({
            product: product.name,
            missing: difference,
            amount: adjustmentAmount,
          });
        }
        // If excess inventory (system < actual) → Could be income or just adjustment
        // For now, we'll just update quantity without creating income transaction
      }
    });

    // Reload products to reflect changes
    if (hasDifference) {
      setLocalProducts(getProducts());
    }

    // Create expense transaction for missing inventory
    if (totalAdjustmentAmount > 0) {
      const productNames = adjustments.map(a => `${a.product} (thiếu ${a.missing})`).join(', ');
      onAddTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: totalAdjustmentAmount,
        wallet: "cash", // Default to cash wallet
        category: "Thất thoát hàng hóa",
        note: `So khớp kho: ${productNames}`,
        isReconciliation: true,
      });

      alert(`✅ So khớp kho hoàn tất!\n💰 Đã tạo transaction chi: ${formatVND(totalAdjustmentAmount)}`);
    } else if (hasDifference) {
      alert("✅ So khớp kho hoàn tất!\n📦 Đã cập nhật số lượng sản phẩm");
    } else {
      alert("✅ Số lượng khớp chính xác! Không cần điều chỉnh.");
    }

    setShowInventoryReconcileModal(false);
  };

  const WalletCard = ({ title, amount, icon: Icon, color, walletType }) => (
    <div className="bg-gradient-to-br from-deepSlate-800 to-deepSlate-700 dark:from-deepSlate-800 dark:to-deepSlate-700 rounded-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          <Icon size={24} className="text-white" />
        </div>
        <button
          onClick={() => handleReconcileClick(walletType)}
          className="flex items-center space-x-1 px-3 py-1 bg-deepSlate-700 dark:bg-deepSlate-800 hover:bg-deepSlate-600 dark:hover:bg-emerald-700 rounded-lg text-sm text-deepSlate-400 dark:text-deepSlate-300 transition-colors"
        >
          <RefreshCw size={14} />
          <span>So khớp</span>
        </button>
      </div>
      <h3 className="text-emerald-500 dark:text-emerald-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
        {formatVND(amount)}
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
          Tổng quan Quỹ
        </h1>
        <p className="text-emerald-500 dark:text-deepSlate-300 mt-1">
          Quản lý tài sản thanh khoản của bạn
        </p>
      </div>

      {/* Total Balance - Luôn tính từ giao dịch trong Sổ Thu Chi */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-deepSlate-800 dark:to-emerald-400 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TrendingUp size={32} className="mr-3" />
            <div>
              <p className="text-deepSlate-100 text-sm">Tổng tài sản thanh khoản</p>
              <p className="text-4xl font-bold">{formatVND(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-deepSlate-100 text-sm">
          <span>Tiền mặt: {formatVND(calculatedFromTx.cash)}</span>
          <span>•</span>
          <span>Ngân hàng: {formatVND(calculatedFromTx.bank)}</span>
        </div>
        <p className="text-deepSlate-400/80 text-xs mt-2">
          Tổng tài sản = Tiền mặt + Ngân hàng (tự động tính từ giao dịch trong Sổ Thu Chi).
        </p>
      </div>

      {/* Individual Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletCard
          title="Tiền mặt"
          amount={calculatedFromTx.cash}
          icon={Wallet}
          color="bg-emerald-600"
          walletType="cash"
        />
        <WalletCard
          title="Ngân hàng"
          amount={calculatedFromTx.bank}
          icon={Wallet}
          color="bg-emerald-600"
          walletType="bank"
        />
      </div>

      {/* Tiền Hàng (Inventory Value) */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500 rounded-lg p-6 text-white shadow-lg cursor-pointer hover:from-emerald-700 hover:to-emerald-600 transition-all"
           onClick={() => {
             // Initialize actual quantities with current quantities
             const initialQuantities = {};
             localProducts.forEach(product => {
               initialQuantities[product.id] = product.quantity || 0;
             });
             setInventoryActualQuantities(initialQuantities);
             setShowInventoryReconcileModal(true);
           }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Package size={32} className="mr-3" />
            <div>
              <p className="text-deepSlate-100 text-sm">Tiền Hàng</p>
              <p className="text-4xl font-bold">{formatVND(inventoryValue)}</p>
              <p className="text-deepSlate-100 text-xs mt-1">
                Giá trị sản phẩm trong kho (theo giá vốn)
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-1 px-3 py-1 bg-deepSlate-700/50 hover:bg-deepSlate-700/50 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} />
            <span>So khớp</span>
          </button>
        </div>
      </div>

      {/* Số tiền tạm đoán từ các sàn TMĐT */}
      {tmdtPending.total > 0 && (
        <div className="bg-gradient-to-br from-deepSlate-8000 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShoppingBag size={32} className="mr-3" />
              <div>
                <p className="text-deepSlate-100 text-sm">Số tiền tạm đoán (TMĐT)</p>
                <p className="text-4xl font-bold">{formatVND(tmdtPending.total)}</p>
                <p className="text-deepSlate-100 text-xs mt-1">
                  Tiền chưa rút về từ các sàn thương mại điện tử
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {tmdtPending.tiktok > 0 && (
              <div className="bg-yellow-700/30 rounded-lg p-3">
                <p className="text-yellow-200 text-xs mb-1">📱 TikTok</p>
                <p className="text-lg font-semibold">{formatVND(tmdtPending.tiktok)}</p>
              </div>
            )}
            {tmdtPending.shopee > 0 && (
              <div className="bg-yellow-700/30 rounded-lg p-3">
                <p className="text-yellow-200 text-xs mb-1">🛒 Shopee</p>
                <p className="text-lg font-semibold">{formatVND(tmdtPending.shopee)}</p>
              </div>
            )}
            {tmdtPending.ecommerce > 0 && (
              <div className="bg-yellow-700/30 rounded-lg p-3">
                <p className="text-yellow-200 text-xs mb-1">🛒 Sàn TMĐT khác</p>
                <p className="text-lg font-semibold">{formatVND(tmdtPending.ecommerce)}</p>
              </div>
            )}
          </div>
          <p className="text-yellow-200 text-xs mt-3 italic">
            💡 Lưu ý: Đây chỉ là số tiền dự đoán, chưa tính vào quỹ. Khi rút về, thêm vào "Sổ Thu Chi" với category tương ứng.
          </p>
        </div>
      )}

      {/* Lợi nhuận sàn TMĐT */}
      <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TrendingUp size={24} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                Lợi nhuận sàn TMĐT
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ⚠️ Chỉ là dự đoán - KHÔNG tính vào thu chi thực tế
              </p>
            </div>
          </div>
          <select
            value={tmdtProfitPeriod}
            onChange={(e) => setTmdtProfitPeriod(e.target.value)}
            className="px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="day">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="90days">90 ngày qua</option>
          </select>
        </div>

        {/* Total Profit */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4 mb-4 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-1">
                Tổng lợi nhuận ({tmdtProfitPeriod === 'day' ? 'Hôm nay' : tmdtProfitPeriod === 'week' ? '7 ngày' : tmdtProfitPeriod === 'month' ? '30 ngày' : '90 ngày'})
              </p>
              <p className={`text-3xl font-bold ${
                tmdtProfit.total.profit >= 0 
                  ? 'text-indigo-900 dark:text-indigo-100' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatVND(tmdtProfit.total.profit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Doanh thu</p>
              <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                {formatVND(tmdtProfit.total.revenue)}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 mb-1">Giá vốn</p>
              <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                {formatVND(tmdtProfit.total.cost)}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tmdtProfit.tiktok.revenue > 0 && (
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📱</span>
                <p className="text-sm font-medium text-pink-800 dark:text-pink-300">TikTok</p>
              </div>
              <p className={`text-2xl font-bold mb-2 ${
                tmdtProfit.tiktok.profit >= 0 
                  ? 'text-pink-900 dark:text-pink-100' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatVND(tmdtProfit.tiktok.profit)}
              </p>
              <div className="text-xs text-pink-600 dark:text-pink-400 space-y-0.5">
                <p>Doanh thu: {formatVND(tmdtProfit.tiktok.revenue)}</p>
                <p>Giá vốn: {formatVND(tmdtProfit.tiktok.cost)}</p>
              </div>
            </div>
          )}

          {tmdtProfit.shopee.revenue > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">🛒</span>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Shopee</p>
              </div>
              <p className={`text-2xl font-bold mb-2 ${
                tmdtProfit.shopee.profit >= 0 
                  ? 'text-orange-900 dark:text-orange-100' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatVND(tmdtProfit.shopee.profit)}
              </p>
              <div className="text-xs text-orange-600 dark:text-orange-400 space-y-0.5">
                <p>Doanh thu: {formatVND(tmdtProfit.shopee.revenue)}</p>
                <p>Giá vốn: {formatVND(tmdtProfit.shopee.cost)}</p>
              </div>
            </div>
          )}

          {tmdtProfit.ecommerce.revenue > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">🛒</span>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Sàn TMĐT khác</p>
              </div>
              <p className={`text-2xl font-bold mb-2 ${
                tmdtProfit.ecommerce.profit >= 0 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatVND(tmdtProfit.ecommerce.profit)}
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                <p>Doanh thu: {formatVND(tmdtProfit.ecommerce.revenue)}</p>
                <p>Giá vốn: {formatVND(tmdtProfit.ecommerce.cost)}</p>
              </div>
            </div>
          )}
        </div>

        {tmdtProfit.total.revenue === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Chưa có đơn hàng TMĐT trong khoảng thời gian này
          </p>
        )}

        {/* Important Note */}
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-400">
            <strong>⚠️ Lưu ý quan trọng:</strong> Lợi nhuận này chỉ là dự đoán từ các đơn hàng trên sàn TMĐT (chưa rút về). 
            <strong className="block mt-1">KHÔNG được tính vào phần "Số Tiền Lời Trong Ngày" và "Sổ Thu Chi"</strong> 
            vì tiền chưa về quỹ thực tế. Chỉ khi bạn rút tiền về và thêm transaction "Rút tiền TikTok/Shopee" vào "Sổ Thu Chi" thì mới tính vào thu chi thực tế.
          </p>
        </div>
      </div>

      {/* Số tiền lời + Số thực về thu chi - nằm cạnh nhau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Số tiền lời - Lời từ đơn hàng (doanh thu - giá vốn) */}
        <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700">
          <div className="flex items-center mb-4">
            <TrendingUp size={24} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
              Số tiền lời
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Ô 1: Số Tiền Lời Trong Ngày */}
          <div className={`rounded-lg p-4 border ${
            (profitFromTransactions.todayProfit ?? 0) >= 0 
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center mb-2">
              <TrendingUp size={20} className={`mr-2 ${
                (profitFromTransactions.todayProfit ?? 0) >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
              <p className={`text-sm font-semibold ${
                (profitFromTransactions.todayProfit ?? 0) >= 0 
                  ? 'text-blue-800 dark:text-blue-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                Số Tiền Lời Trong Ngày
              </p>
            </div>
            <p className={`text-2xl font-bold ${
              (profitFromTransactions.todayProfit ?? 0) >= 0 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-red-900 dark:text-red-100'
            }`}>
              {formatVND(profitFromTransactions.todayProfit ?? 0)}
            </p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
              Tiền lời mỗi ngày Thu-vốn
            </p>
          </div>

          {/* Ô 2: Số Tiền Lời Trong Tháng */}
          <div className={`rounded-lg p-4 border ${
            (profitFromTransactions.totalMonthProfit ?? 0) >= 0 
              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center mb-2">
              <TrendingUp size={20} className={`mr-2 ${
                (profitFromTransactions.totalMonthProfit ?? 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
              <p className={`text-sm font-semibold ${
                (profitFromTransactions.totalMonthProfit ?? 0) >= 0 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                Số Tiền Lời Trong Tháng
              </p>
            </div>
            <p className={`text-2xl font-bold ${
              (profitFromTransactions.totalMonthProfit ?? 0) >= 0 
                ? 'text-green-900 dark:text-green-100' 
                : 'text-red-900 dark:text-red-100'
            }`}>
              {formatVND(profitFromTransactions.totalMonthProfit ?? 0)}
            </p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
              Tổng lời từ ngày 1 đến cuối tháng (Số tiền lời ngày cộng dồn)
            </p>
          </div>
        </div>

        {/* So sánh với nợ tháng này */}
        {currentMonthDebt > 0 && (
          <div className={`rounded-lg p-4 border mb-4 ${
            remainingAfterCurrentMonthDebt >= 0
              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  So sánh với nợ tháng này
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lời tháng: {formatVND(profitFromTransactions.totalMonthProfit ?? 0)} - Nợ tháng này: {formatVND(currentMonthDebt)}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {remainingAfterCurrentMonthDebt >= 0 ? (
                <div className="flex items-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg mr-2">✅</span>
                  <div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      Còn dư: {formatVND(remainingAfterCurrentMonthDebt)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Đủ trả nợ tháng này và còn dư
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-lg mr-2">⚠️</span>
                  <div>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      Thiếu: {formatVND(Math.abs(remainingAfterCurrentMonthDebt))}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Không đủ trả nợ tháng này
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Số ngày dự kiến trả xong nợ */}
        {totalDebt > 0 && (
          <div className={`rounded-lg p-4 border ${
            daysToPayOffDebt === Infinity || daysToPayOffDebt < 0
              ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800'
          }`}>
            <div className="flex items-center mb-2">
              <Calendar size={20} className={`mr-2 ${
                daysToPayOffDebt === Infinity || daysToPayOffDebt < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-purple-600 dark:text-purple-400'
              }`} />
              <p className={`text-sm font-semibold ${
                daysToPayOffDebt === Infinity || daysToPayOffDebt < 0
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-purple-800 dark:text-purple-300'
              }`}>
                Số ngày dự kiến trả xong nợ
              </p>
            </div>
            <p className={`text-2xl font-bold ${
              daysToPayOffDebt === Infinity || daysToPayOffDebt < 0
                ? 'text-red-900 dark:text-red-100'
                : 'text-purple-900 dark:text-purple-100'
            }`}>
              {daysToPayOffDebt === Infinity 
                ? 'Không thể trả' 
                : daysToPayOffDebt < 0
                ? 'N/A'
                : `${daysToPayOffDebt} ngày`}
            </p>
            {daysToPayOffDebt !== Infinity && daysToPayOffDebt > 0 && (
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 space-y-0.5">
                <p>≈ {Math.ceil(daysToPayOffDebt / 30)} tháng</p>
                <p>≈ {Math.round(daysToPayOffDebt / 365)} năm</p>
                <p className="mt-1 opacity-75">
                  ({formatVND(totalDebt)} ÷ {formatVND(actualNetProfit.todayNetProfit)}/ngày)
                </p>
              </div>
            )}
            {daysToPayOffDebt === Infinity && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                (Chi phí ≥ Thu nhập, không thể trả nợ)
              </p>
            )}
          </div>
        )}
        </div>

        {/* Số thực về thu chi - Lời - Chi (kiểm tra tiền kiếm được vs chi ra) */}
        <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700">
          <div className="flex items-center mb-4">
            <Calendar size={24} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
              Số thực về thu chi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ô 1: TB ngày lợi nhuận */}
            <div className={`rounded-lg p-4 border ${
              (actualNetProfit.todayNetProfit ?? 0) >= 0 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
                : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center mb-2">
                <Calendar size={20} className={`mr-2 ${
                  (actualNetProfit.todayNetProfit ?? 0) >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <p className={`text-sm font-semibold ${
                  (actualNetProfit.todayNetProfit ?? 0) >= 0 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  TB Lời-chi ngày
                </p>
              </div>
              <p className={`text-2xl font-bold ${
                (actualNetProfit.todayNetProfit ?? 0) >= 0 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {formatVND(actualNetProfit.todayNetProfit ?? 0)}
              </p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                Số tiền lời trong ngày - Chi hôm nay (không tính Ứng hàng)
              </p>
            </div>

            {/* Ô 2: TB tháng Lợi Nhuận */}
            <div className={`rounded-lg p-4 border ${
              (actualNetProfit.totalMonthNetProfit ?? 0) >= 0 
                ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center mb-2">
                <Calendar size={20} className={`mr-2 ${
                  (actualNetProfit.totalMonthNetProfit ?? 0) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <p className={`text-sm font-semibold ${
                  (actualNetProfit.totalMonthNetProfit ?? 0) >= 0 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  TB Lời-chi tháng
                </p>
              </div>
              <p className={`text-2xl font-bold ${
                (actualNetProfit.totalMonthNetProfit ?? 0) >= 0 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {formatVND(actualNetProfit.totalMonthNetProfit ?? 0)}
              </p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                Tổng (TB ngày lợi nhuận) từ ngày 1 đến cuối tháng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Số tiền muốn kiếm (Target Earnings) */}
      <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700">
        <div className="flex items-center mb-6">
          <Target size={24} className="mr-2 text-orange-600 dark:text-orange-400" />
          <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
            Số tiền muốn kiếm
          </h2>
        </div>

        {/* Input Target Days */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nhập số ngày muốn kiếm {isTargetSaved && <span className="text-green-600 dark:text-green-400">(Đã lưu)</span>}:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isTargetSaved ? 'text-gray-400' : 'text-gray-400'
              }`} size={20} />
              <input
                type="number"
                value={targetDays || ''}
                onChange={(e) => !isTargetSaved && setTargetDays(parseFloat(e.target.value) || 0)}
                placeholder="Ví dụ: 30"
                disabled={isTargetSaved}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg text-lg ${
                  isTargetSaved
                    ? 'border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'border-deepSlate-700 dark:border-deepSlate-700 bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                }`}
              />
            </div>
            <button
              onClick={handleSaveTarget}
              disabled={!targetDays || targetDays <= 0 || isCalculating || isTargetSaved}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Save size={18} />
              {isCalculating ? 'Đang lưu...' : isTargetSaved ? 'Đã lưu' : 'Lưu lại'}
            </button>
          </div>
          {targetDays > 0 && (
            <div className="mt-2 space-y-1">
              {targetEarnings > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mục tiêu: <span className="font-semibold text-orange-600 dark:text-orange-400">{formatVND(targetEarnings)}</span> trong <span className="font-semibold text-purple-600 dark:text-purple-400">{targetDays} ngày</span>
                  <br />
                  Cần đạt TB: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatVND(targetStats.dailyTargetRequired)}</span>/ngày
                </p>
              )}
            </div>
          )}
        </div>

        {/* Input Target Earnings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tiền muốn kiếm {isTargetSaved && <span className="text-green-600 dark:text-green-400">(Đã lưu)</span>}:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isTargetSaved ? 'text-gray-400' : 'text-gray-400'
              }`} size={20} />
              <input
                type="number"
                value={targetEarnings || ''}
                onChange={(e) => !isTargetSaved && setTargetEarnings(parseFloat(e.target.value) || 0)}
                placeholder="Tự động tính từ số ngày hoặc nhập thủ công"
                disabled={isTargetSaved}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg text-lg ${
                  isTargetSaved
                    ? 'border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'border-deepSlate-700 dark:border-deepSlate-700 bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                }`}
              />
            </div>
            {(targetEarnings > 0 || targetDays > 0) && (
              <button
                onClick={handleResetTarget}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-2"
                title="Làm mới"
              >
                <RefreshCw size={18} />
                Làm mới
              </button>
            )}
          </div>
        </div>

        {/* Mục tiêu - Stats Grid */}
        {targetDays > 0 && targetEarnings > 0 && (
          <>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-deepSlate-50 dark:text-deepSlate-100 flex items-center">
                <Target size={20} className="mr-2 text-orange-600 dark:text-orange-400" />
                Mục tiêu Tài Chính (Cần đạt trong {targetDays} ngày)
              </h3>
            </div>

            {/* Row 1: 3 KPI chính */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Cột 1: Mục tiêu tổng */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center mb-2">
                  <Target size={20} className="text-orange-600 dark:text-orange-400 mr-2" />
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Mục tiêu tổng
                  </p>
                </div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatVND(targetEarnings)}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Trong {targetDays} ngày ({Math.round(targetDays/30)} tháng)
                </p>
              </div>

              {/* Cột 2: Mục tiêu hàng ngày */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-2">
                  <DollarSign size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Mục tiêu /ngày
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatVND(targetStats.dailyTargetRequired)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {formatVND(targetEarnings)} ÷ {targetDays} ngày
                </p>
              </div>

              {/* Cột 3: Thực tế hôm nay */}
              <div className={`rounded-lg p-4 border ${
                actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                  ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                  : actualNetProfit.todayNetProfit > 0
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center mb-2">
                  <TrendingUp size={20} className={`mr-2 ${
                    actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                      ? 'text-green-600 dark:text-green-400'
                      : actualNetProfit.todayNetProfit > 0
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                      ? 'text-green-800 dark:text-green-300'
                      : actualNetProfit.todayNetProfit > 0
                      ? 'text-yellow-800 dark:text-yellow-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    Lợi nhuận thực tế /ngày
                  </p>
                </div>
                <p className={`text-2xl font-bold ${
                  actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                    ? 'text-green-900 dark:text-green-100'
                    : actualNetProfit.todayNetProfit > 0
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {formatVND(actualNetProfit.todayNetProfit)}
                </p>
                <p className={`text-xs mt-1 ${
                  actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                    ? 'text-green-600 dark:text-green-400'
                    : actualNetProfit.todayNetProfit > 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {actualNetProfit.todayNetProfit >= targetStats.dailyTargetRequired
                    ? `✓ Đạt ${targetStats.achievementRate}%`
                    : actualNetProfit.todayNetProfit > 0
                    ? `Đạt ${targetStats.achievementRate}% (Thiếu ${formatVND(targetStats.dailyTargetRequired - actualNetProfit.todayNetProfit)})`
                    : 'Chưa có lợi nhuận'}
                </p>
              </div>
            </div>

            {/* Row 2: Dự báo & So sánh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Cột 1: Số tiền còn lại */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center mb-2">
                  <DollarSign size={20} className="text-purple-600 dark:text-purple-400 mr-2" />
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Còn cần kiếm
                  </p>
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatVND(targetStats.remainingEarnings)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Dựa trên tốc độ kiếm hôm nay
                </p>
              </div>

              {/* Cột 2: Dự báo hoàn thành */}
              <div className={`rounded-lg p-4 border ${
                targetStats.status === 'ahead'
                  ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                  : targetStats.status === 'on-track'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
                  : targetStats.status === 'behind'
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center mb-2">
                  <Calendar size={20} className={`mr-2 ${
                    targetStats.status === 'ahead'
                      ? 'text-green-600 dark:text-green-400'
                      : targetStats.status === 'on-track'
                      ? 'text-blue-600 dark:text-blue-400'
                      : targetStats.status === 'behind'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    targetStats.status === 'ahead'
                      ? 'text-green-800 dark:text-green-300'
                      : targetStats.status === 'on-track'
                      ? 'text-blue-800 dark:text-blue-300'
                      : targetStats.status === 'behind'
                      ? 'text-yellow-800 dark:text-yellow-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    Dự báo hoàn thành
                  </p>
                </div>
                <p className={`text-2xl font-bold ${
                  targetStats.status === 'ahead'
                    ? 'text-green-900 dark:text-green-100'
                    : targetStats.status === 'on-track'
                    ? 'text-blue-900 dark:text-blue-100'
                    : targetStats.status === 'behind'
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {targetStats.status === 'unachievable'
                    ? 'Không thể đạt'
                    : targetStats.estimatedDaysToTarget === -Infinity
                    ? 'Không thể đạt'
                    : `${Math.ceil(targetStats.estimatedDaysToTarget)} ngày`}
                </p>
                <p className={`text-xs mt-1 ${
                  targetStats.status === 'ahead'
                    ? 'text-green-600 dark:text-green-400'
                    : targetStats.status === 'on-track'
                    ? 'text-blue-600 dark:text-blue-400'
                    : targetStats.status === 'behind'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {targetStats.status === 'ahead'
                    ? '✓ Sắp đạt mục tiêu'
                    : targetStats.status === 'on-track'
                    ? 'Có thể đạt đúng hạn'
                    : targetStats.status === 'behind'
                    ? `Cần thêm ${Math.ceil(targetStats.estimatedDaysToTarget - targetDays)} ngày`
                    : 'Lợi nhuận phải > 0'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Thực tế - Detailed Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {(() => {
            // "Lợi Nhuận Hôm Nay" = Lợi nhuận hôm nay từ giao dịch THU (income profit only - không trừ chi phí)
            const profitFromTx = profitFromTransactions.todayProfit ?? 0;
            const tbNgayThucTe = profitFromTx;
            const hasTarget = targetDays > 0 && targetEarnings > 0;
            
            // Tính toán các chỉ số so sánh với mục tiêu
            const tbNgayCanDat = hasTarget ? targetStats.dailyTargetRequired : 0;
            const diffNgay = targetStats.dailyNetProfitVsTarget;
            const isDu = diffNgay >= 0;

            const borderColor = !hasTarget
              ? currentTheme.card_border
              : isDu
              ? currentTheme.success
              : currentTheme.error;

            return (
              <div 
                className="rounded-lg p-6 border-2"
                style={{
                  backgroundColor: !hasTarget ? currentTheme.bg_primary : isDu ? currentTheme.bg_primary : currentTheme.bg_secondary,
                  borderColor: borderColor
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <TrendingUp 
                      size={24} 
                      className="mr-3" 
                      style={{ color: !hasTarget ? currentTheme.text_primary : isDu ? currentTheme.success : currentTheme.error }}
                    />
                    <h3 
                      className="text-lg font-bold"
                      style={{ color: !hasTarget ? currentTheme.text_primary : isDu ? currentTheme.success : currentTheme.error }}
                    >
                      {hasTarget ? 'So Sánh Với Mục Tiêu' : 'Lợi Nhuận Hôm Nay'}
                    </h3>
                  </div>
                  {hasTarget && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        backgroundColor: isDu ? currentTheme.success : currentTheme.error,
                        color: isDu ? currentTheme.bg_primary : currentTheme.bg_primary
                      }}
                    >
                      {isDu ? '✓ ĐẠT' : '✗ THIẾU'}
                    </span>
                  )}
                </div>

                {hasTarget && (
                  <div className="space-y-3">
                    <div 
                      className="flex justify-between items-center pb-2 border-b"
                      style={{ borderColor: isDu ? currentTheme.success : currentTheme.error }}
                    >
                      <span className="text-sm font-medium" style={{ color: currentTheme.text_primary }}>
                        Thực tế hôm nay:
                      </span>
                      <span className="text-xl font-bold" style={{ color: isDu ? currentTheme.success : currentTheme.error }}>
                        {formatVND(tbNgayThucTe)}
                      </span>
                    </div>
                    
                    <div 
                      className="flex justify-between items-center pb-2 border-b"
                      style={{ borderColor: isDu ? currentTheme.success : currentTheme.error }}
                    >
                      <span className="text-sm font-medium" style={{ color: currentTheme.text_primary }}>
                        Mục tiêu hôm nay:
                      </span>
                      <span className="text-xl font-bold" style={{ color: isDu ? currentTheme.success : currentTheme.error }}>
                        {formatVND(tbNgayCanDat)}
                      </span>
                    </div>

                    <div 
                      className="flex justify-between items-center pt-2 px-3 py-3 rounded"
                      style={{ 
                        backgroundColor: isDu ? `${currentTheme.success}20` : `${currentTheme.error}20`
                      }}
                    >
                      <span 
                        className="text-sm font-bold"
                        style={{ color: isDu ? currentTheme.success : currentTheme.error }}
                      >
                        {isDu ? '➕ Dư:' : '➖ Thiếu:'}
                      </span>
                      <span 
                        className="text-2xl font-black"
                        style={{ color: isDu ? currentTheme.success : currentTheme.error }}
                      >
                        {isDu ? '+' : ''}{formatVND(Math.abs(diffNgay))}
                      </span>
                    </div>
                  </div>
                )}

                {!hasTarget && (
                  <div className="mt-4">
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: currentTheme.accent_dark }}
                    >
                      {formatVND(tbNgayThucTe)}
                    </p>
                    <p className="text-xs mt-2" style={{ color: currentTheme.text_secondary }}>
                      Hãy đặt mục tiêu để theo dõi tiến độ
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Về tính năng "So khớp quỹ"
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Khi số dư thực tế khác số dư hệ thống, ứng dụng sẽ tự động tạo giao
          dịch điều chỉnh:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-400 mt-2 space-y-1 ml-4">
          <li>
            • Thiếu tiền → Ghi nhận "Thất thoát không rõ nguyên nhân" (Chi phí)
          </li>
          <li>• Thừa tiền → Ghi nhận "Điều chỉnh thừa" (Thu nhập)</li>
        </ul>
      </div>

      {/* Inventory Reconciliation Modal */}
      {showInventoryReconcileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                So khớp kho - Kiểm tra số lượng sản phẩm
              </h3>
              <button
                onClick={() => setShowInventoryReconcileModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                💡 Nhập số lượng thực tế của từng sản phẩm. Nếu thiếu hàng, hệ thống sẽ tự động tạo transaction chi.
              </p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {localProducts.map((product) => {
                const systemQuantity = product.quantity || 0;
                const actualQuantity = parseFloat(inventoryActualQuantities[product.id]) || 0;
                const difference = systemQuantity - actualQuantity;
                const cost = product.cost || product.price * 0.6;
                const adjustmentAmount = difference > 0 ? difference * cost : 0;

                return (
                  <div
                    key={product.id}
                    className="bg-deepSlate-700 dark:bg-deepSlate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-deepSlate-50 dark:text-deepSlate-100 line-clamp-2 break-words" title={product.name || product.productName || ''}>
                          {product.name || product.productName || 'Sản phẩm'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Giá vốn: {formatVND(cost)} | Hệ thống: {systemQuantity} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Số lượng thực tế:
                        </label>
                        <input
                          type="number"
                          value={inventoryActualQuantities[product.id] || ''}
                          onChange={(e) =>
                            setInventoryActualQuantities({
                              ...inventoryActualQuantities,
                              [product.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        {difference !== 0 && (
                          <div className={`text-sm font-semibold px-3 py-2 rounded ${
                            difference > 0
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          }`}>
                            {difference > 0 ? (
                              <>
                                ❌ Thiếu: {difference} sản phẩm
                                <br />
                                <span className="text-xs">Chi: {formatVND(adjustmentAmount)}</span>
                              </>
                            ) : (
                              <>
                                ✅ Thừa: {Math.abs(difference)} sản phẩm
                              </>
                            )}
                          </div>
                        )}
                        {difference === 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                            ✅ Khớp
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {localProducts.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Chưa có sản phẩm nào trong kho
              </p>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInventoryReconcileModal(false)}
                className="flex-1 px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleInventoryReconcile}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Xác nhận So khớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                So khớp quỹ -{" "}
                {reconcileWallet === "cash" ? "Tiền mặt" : "Ngân hàng"}
              </h3>
              <button
                onClick={() => setShowReconcileModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-deepSlate-700 dark:bg-deepSlate-800 rounded-lg p-4">
                <p className="text-sm text-emerald-500 dark:text-emerald-400 mb-1">
                  Số dư hệ thống:
                </p>
                <p className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                  {formatVND(calculatedFromTx[reconcileWallet] ?? 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số tiền thực tế đang có:
                </label>
                <input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="Nhập số tiền thực tế..."
                  className="w-full px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {actualAmount && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    {(calculatedFromTx[reconcileWallet] ?? 0) > parseFloat(actualAmount) ? (
                      <>
                        ⚠️ Chênh lệch:{" "}
                        <strong className="text-red-600">
                          {formatVND(
                            (calculatedFromTx[reconcileWallet] ?? 0) - parseFloat(actualAmount),
                          )}
                        </strong>{" "}
                        (Thiếu)
                      </>
                    ) : (calculatedFromTx[reconcileWallet] ?? 0) < parseFloat(actualAmount) ? (
                      <>
                        ✅ Chênh lệch:{" "}
                        <strong className="text-green-600">
                          +
                          {formatVND(
                            parseFloat(actualAmount) - (calculatedFromTx[reconcileWallet] ?? 0),
                          )}
                        </strong>{" "}
                        (Thừa)
                      </>
                    ) : (
                      "✅ Số dư khớp chính xác!"
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReconcileModal(false)}
                className="flex-1 px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleReconcile}
                disabled={!actualAmount}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận So khớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tổng nợ cần trả */}
      {totalDebt > 0 && (
        <div className="bg-gradient-to-br from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingDown size={32} className="mr-3" />
              <div>
                <p className="text-red-100 text-sm">Tổng nợ cần trả</p>
                <p className="text-4xl font-bold">{formatVND(totalDebt)}</p>
                <p className="text-red-100 text-xs mt-1">
                  Số tiền nợ cần thanh toán trong tương lai
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Promotion */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">👇 NHẬN 5 CÂU TRÍCH DẪN ĐỘNG LỰC CỨ MỖI 30P</p>
          <p className="text-sm mb-3">BẮT ĐẦU TỪ 7H SÁNG - 10H ĐÊM TẠI KÊNH TELEGRAM</p>
          <a
            href="https://t.me/vinreviewsach"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
          >
            🔗 https://t.me/vinreviewsach
          </a>
        </div>
      </div>
    </div>
  );
}

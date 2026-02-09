import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  UserMinus,
  Edit2,
  ChevronDown,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { getDebts, addDebt, updateDebt, getUngHangPaid, addUngHangPayment, clearUngHangPaidForCustomer, getUngHangPaidItems, addUngHangPaidItems, toLocalDateStr } from "@/utils/localStorage";

export default function CashflowLedgerModule({
  transactions,
  orders = [],
  categories,
  wallets,
  customers = [],
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  onUpdateWallets,
  onUpdateOrder,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "income",
    amount: "",
    wallet: "cash",
    category: "",
    note: "",
  });
  const [debtData, setDebtData] = useState({
    creditor: "",
    numberOfMonths: "", // Số tháng còn lại
    recurringDay: "", // Ngày định kỳ (1-31)
    monthlyPayments: [], // Mảng các payment cho mỗi tháng: [{ principal, interest }]
  });
  const [showCreditorDropdown, setShowCreditorDropdown] = useState(false);
  const [savedCreditors, setSavedCreditors] = useState([]);
  const [debts, setDebts] = useState([]);
  const [payUngHangGroup, setPayUngHangGroup] = useState(null);
  const [payUngHangAmount, setPayUngHangAmount] = useState("");
  const [payQuantities, setPayQuantities] = useState({}); // { productId: số lượng thanh toán }
  const [payUngHangWallet, setPayUngHangWallet] = useState("cash");
  const [expandedUngHangCustomer, setExpandedUngHangCustomer] = useState(null);
  // Load debts from localStorage
  useEffect(() => {
    setDebts(getDebts());
  }, []);

  // Reload debts when transactions change (in case of payment)
  useEffect(() => {
    setDebts(getDebts());
  }, [transactions.length]);

  // Extract unique creditor names from transactions, debts, and customers
  useEffect(() => {
    const creditors = new Set();
    // Add from transactions
    transactions.forEach((t) => {
      if (t.creditor && t.creditor.trim()) {
        creditors.add(t.creditor.trim());
      }
    });
    // Add from debts
    debts.forEach((d) => {
      if (d.creditor && d.creditor.trim()) {
        creditors.add(d.creditor.trim());
      }
    });
    // Add from customers
    customers.forEach((c) => {
      if (c.name && c.name.trim()) {
        creditors.add(c.name.trim());
      }
    });
    setSavedCreditors(Array.from(creditors).sort());
  }, [transactions, debts, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreditorDropdown && !event.target.closest('.creditor-input-container')) {
        setShowCreditorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreditorDropdown]);

  const formatVND = (amount) => {
    const n = Number(amount);
    if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.category) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Số tiền phải lớn hơn 0!");
      return;
    }

    // Update wallets (income và nhap đều cộng vào ví; expense trừ)
    const newWallets = { ...wallets };
    if (formData.type === "income" || formData.type === "nhap") {
      newWallets[formData.wallet] += amount;
    } else {
      newWallets[formData.wallet] -= amount;
    }
    onUpdateWallets(newWallets);

    // Add transaction with proper type conversion
    const transactionData = {
      ...formData,
      amount: amount, // Ensure amount is a number
      date: formData.date || new Date().toISOString().split("T")[0],
    };
    onAddTransaction(transactionData);

    // Reset form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "income",
      amount: "",
      wallet: "cash",
      category: "",
      note: "",
    });
    setShowAddModal(false);
  };

  const handleDebtRepayment = () => {
    if (!debtData.creditor || !debtData.numberOfMonths || !debtData.recurringDay) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (debtData.monthlyPayments.length === 0 || debtData.monthlyPayments.some(p => !p.principal || parseFloat(p.principal) <= 0)) {
      alert("Vui lòng điền số tiền gốc cho tất cả các tháng!");
      return;
    }

    // Lưu thông tin khoản nợ định kỳ (KHÔNG tạo transactions ngay)
    const newDebt = addDebt({
      creditor: debtData.creditor,
      numberOfMonths: parseInt(debtData.numberOfMonths),
      recurringDay: parseInt(debtData.recurringDay),
      monthlyPayments: debtData.monthlyPayments.map((p, index) => ({
        monthIndex: index + 1,
        principal: parseFloat(p.principal) || 0,
        interest: parseFloat(p.interest) || 0,
        paid: false, // Chưa trả
        paidDate: null,
      })),
      startDate: formData.date,
      wallet: formData.wallet,
    });

    // Reload debts
    setDebts(getDebts());

    alert(`✅ Đã tạo khoản nợ định kỳ cho ${debtData.creditor} (${debtData.numberOfMonths} tháng)`);

    // Reset
    setDebtData({ 
      creditor: "", 
      numberOfMonths: "",
      recurringDay: "",
      monthlyPayments: [],
    });
    setShowCreditorDropdown(false);
    setShowDebtModal(false);
  };

  const handleDelete = (transaction) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) {
      return;
    }

    // Ứng hàng chưa thu: không trừ ví → không đảo ví khi xóa
    if (transaction.category === "Ứng hàng chưa thu") {
      onDeleteTransaction(transaction.id);
      return;
    }
    // Reverse wallet changes
    const newWallets = { ...wallets };
    if (transaction.type === "income" || transaction.type === "nhap") {
      newWallets[transaction.wallet] -= transaction.amount;
    } else if (
      transaction.type === "expense" ||
      transaction.type === "debt_payment"
    ) {
      newWallets[transaction.wallet] += transaction.amount;
    }
    onUpdateWallets(newWallets);

    onDeleteTransaction(transaction.id);
  };

  const handlePayDebt = (debt) => {
    if (!window.confirm(`Xác nhận thanh toán ${formatVND(debt.totalAmount)} cho ${debt.creditor} (Tháng ${debt.monthIndex})?`)) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const principal = debt.principalAmount || 0;
    const interest = debt.interestAmount || 0;

    // Update wallet
    const newWallets = { ...wallets };
    const totalAmount = principal + interest;
    newWallets[debt.wallet || "cash"] -= totalAmount;
    onUpdateWallets(newWallets);

    // Add principal transaction
    if (principal > 0) {
      onAddTransaction({
        date: today,
        type: "debt_payment",
        amount: principal,
        wallet: debt.wallet || "cash",
        category: "Trả nợ gốc",
        note: `Trả nợ cho ${debt.creditor} - Tiền gốc (Tháng ${debt.monthIndex})`,
        creditor: debt.creditor,
        dueDate: debt.dueDate,
        recurringDay: debt.recurringDay,
      });
    }

    // Add interest transaction
    if (interest > 0) {
      onAddTransaction({
        date: today,
        type: "expense",
        amount: interest,
        wallet: debt.wallet || "cash",
        category: "Lãi vay",
        note: `Trả nợ cho ${debt.creditor} - Lãi vay (Tháng ${debt.monthIndex})`,
        creditor: debt.creditor,
        dueDate: debt.dueDate,
        recurringDay: debt.recurringDay,
      });
    }

    // Mark this month as paid in the debt record
    const debtRecord = debts.find(d => d.id === debt.debtId);
    if (debtRecord) {
      const updatedPayments = debtRecord.monthlyPayments.map(p => 
        p.monthIndex === debt.monthIndex 
          ? { ...p, paid: true, paidDate: today }
          : p
      );
      updateDebt(debt.debtId, { monthlyPayments: updatedPayments });
      setDebts(getDebts()); // Reload debts
    }

    alert(`✅ Đã thanh toán ${formatVND(totalAmount)} cho ${debt.creditor} (Tháng ${debt.monthIndex})`);
  };

  // Calculate upcoming debt payments from debts table
  // Logic: 
  // - Đọc từ bảng debts (khoản nợ định kỳ)
  // - Tính toán tháng nào chưa trả dựa trên startDate và recurringDay
  // - Chỉ hiển thị các tháng chưa trả và có dueDate >= hôm nay
  
  const calculateUpcomingDebts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDebtsList = [];

    debts.forEach((debt) => {
      const startDate = new Date(debt.startDate);
      const recurringDay = debt.recurringDay;

      debt.monthlyPayments.forEach((payment) => {
        // Skip if already paid
        if (payment.paid) return;

        // Calculate due date for this month
        // Month 1 = startDate month, Month 2 = startDate + 1 month, etc.
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (payment.monthIndex - 1));
        dueDate.setDate(recurringDay);
        
        // Adjust if day doesn't exist in that month
        const daysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
        if (recurringDay > daysInMonth) {
          dueDate.setDate(daysInMonth);
        }

        const dueDateStr = dueDate.toISOString().split("T")[0];
        const dueDateObj = new Date(dueDateStr);
        dueDateObj.setHours(0, 0, 0, 0);

        // Only show if due date is today or in the future
        if (dueDateObj >= today && (payment.principal > 0 || payment.interest > 0)) {
          upcomingDebtsList.push({
            debtId: debt.id,
            creditor: debt.creditor,
            dueDate: dueDateStr,
            monthIndex: payment.monthIndex,
            principalAmount: payment.principal,
            interestAmount: payment.interest,
            totalAmount: payment.principal + payment.interest,
            recurringDay: debt.recurringDay,
            wallet: debt.wallet,
            paymentId: payment.monthIndex, // Use monthIndex as payment identifier
          });
        }
      });
    });

    // Sort by dueDate
    return upcomingDebtsList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const upcomingDebtsList = calculateUpcomingDebts();

  // Pending ứng hàng: orders với paymentMethod=ung_hang (BAO GỒM CẢ ĐÃ THANH TOÁN)
  // Hiển thị tất cả để xem lịch sử và số ngày ứng hàng
  const allUngHangOrders = (orders || []).filter(
    (o) => o.paymentMethod === "ung_hang"
  );
  
  // Phiên bản chưa thanh toán (cho phần "Hàng đang ứng")
  const pendingUngHangOrders = allUngHangOrders.filter((o) => !o.ungHangPaid);
  
  // Phiên bản đã thanh toán (cho phần "Lịch sử")
  const paidUngHangOrders = allUngHangOrders.filter((o) => o.ungHangPaid);

  // Gộp theo tên khách hàng: 1 khách = 1 nhóm (sản phẩm gộp, tổng tiền)
  const ungHangPaidMap = getUngHangPaid();
  const ungHangPaidItemsMap = getUngHangPaidItems();
  const groupedUngHang = (() => {
    const byCustomer = {};
    for (const order of pendingUngHangOrders) {
      const name = order.customer || "Khách lẻ";
      if (!byCustomer[name]) {
        byCustomer[name] = {
          customerName: name,
          orders: [],
          itemsMap: {}, // { productId: { name, quantity, totalPrice } }
          totalRevenue: 0,
        };
      }
      const g = byCustomer[name];
      g.orders.push(order);
      g.totalRevenue += order.revenue || 0;
      for (const item of order.items || []) {
        const pid = item.id || item.name;
        if (!g.itemsMap[pid]) {
          g.itemsMap[pid] = { name: item.name || "SP", quantity: 0, totalPrice: 0, totalCost: 0 };
        }
        g.itemsMap[pid].quantity += parseFloat(item.quantity) || 0;
        g.itemsMap[pid].totalPrice += (item.salePrice || item.price || 0) * (parseFloat(item.quantity) || 0);
        g.itemsMap[pid].totalCost += (item.cost || 0) * (parseFloat(item.quantity) || 0);
      }
    }
    return Object.values(byCustomer)
      .map((g) => {
        const paidAmount = ungHangPaidMap[g.customerName] || 0;
        const paidItems = ungHangPaidItemsMap[g.customerName] || {};
        const remaining = (g.totalRevenue || 0) - paidAmount;
        return {
          ...g,
          paidAmount,
          paidItems,
          remaining,
        };
      })
      .filter((g) => g.remaining > 0);
  })();

  const handlePayUngHang = (group) => {
    setPayUngHangGroup(group);
    const paidItems = getUngHangPaidItems()[group.customerName] || {};
    const initialQty = {};
    for (const [pid] of Object.entries(group.itemsMap || {})) {
      initialQty[pid] = 0; // Mặc định 0 để tránh nhầm (người dùng nhập số lượng cần thanh toán)
    }
    setPayQuantities(initialQty);
    const amount = Object.entries(initialQty).reduce((sum, [pid, qty]) => {
      const item = group.itemsMap?.[pid];
      if (!item || !item.quantity) return sum;
      const unitPrice = item.totalPrice / item.quantity;
      return sum + (parseFloat(qty) || 0) * unitPrice;
    }, 0);
    setPayUngHangAmount(String(Math.round(amount)));
    setPayUngHangWallet("cash");
    setExpandedUngHangCustomer(group.customerName);
  };

  const updatePayQuantity = (productId, qty) => {
    const newQuantities = { ...payQuantities, [productId]: qty };
    setPayQuantities(newQuantities);
    if (!payUngHangGroup) return;
    const amount = Object.entries(newQuantities).reduce((sum, [pid, v]) => {
      const it = payUngHangGroup.itemsMap?.[pid];
      if (!it || !it.quantity) return sum;
      const unitPrice = it.totalPrice / it.quantity;
      return sum + (parseFloat(v) || 0) * unitPrice;
    }, 0);
    setPayUngHangAmount(String(Math.round(amount)));
  };

  const confirmPayUngHang = async () => {
    if (!payUngHangGroup || !onUpdateOrder || !onAddTransaction || !onUpdateWallets) return;
    const amount = parseFloat(payUngHangAmount) || 0;
    if (amount <= 0) {
      alert("Vui lòng nhập số lượng hoặc số tiền thanh toán > 0");
      return;
    }
    const group = payUngHangGroup;
    const customerName = group.customerName || "Khách lẻ";
    const walletName = payUngHangWallet === "cash" ? "Tiền mặt" : "Ngân hàng";

    // Ghi nhận số tiền đã thu
    addUngHangPayment(customerName, amount);

    // Ghi nhận số lượng đã thu theo từng sản phẩm (để hiển thị còn lại)
    const itemsDelta = {};
    for (const [pid, qty] of Object.entries(payQuantities)) {
      const v = parseFloat(qty) || 0;
      if (v > 0) itemsDelta[pid] = v;
    }
    
    if (Object.keys(itemsDelta).length > 0) {
      addUngHangPaidItems(customerName, itemsDelta);
    }

    // Ghi chú chi tiết: tên SP x số lượng
    const noteParts = Object.entries(itemsDelta)
      .map(([pid, qty]) => {
        const it = group.itemsMap?.[pid];
        return it ? `${it.name} x${qty}` : null;
      })
      .filter(Boolean);
    const note = noteParts.length > 0
      ? `Thu tiền ứng hàng - Khách ${customerName}: ${noteParts.join(", ")}`
      : `Thu tiền ứng hàng - Khách ${customerName}`;

    // Tính tổng giá vốn của các sản phẩm được thanh toán
    let totalCost = 0;
    
    // Nếu người dùng nhập số lượng sản phẩm
    if (Object.keys(itemsDelta).length > 0) {
      for (const [pid, qty] of Object.entries(itemsDelta)) {
        // Lấy từ itemsMap - nó đã có totalCost đúng
        const itemInfo = group.itemsMap?.[pid];
        if (itemInfo) {
          const unitCost = itemInfo.totalCost / itemInfo.quantity; // Chi phí đơn vị từ itemsMap
          const itemCost = unitCost * qty;
          totalCost += itemCost;
        }
      }
    } else {
      // Nếu người dùng CHỈ nhập số tiền (không nhập số lượng)
      // Tính giá vốn theo tỷ lệ: (số tiền thanh toán / tổng tiền) × tổng vốn
      const totalRevenue = group.totalRevenue || 1; // Tránh chia 0
      const totalItemsCost = Object.values(group.itemsMap || {}).reduce((sum, item) => sum + (item.totalCost || 0), 0);
      totalCost = (amount / totalRevenue) * totalItemsCost;
    }

    // Cộng vào ví
    const newWallets = { ...wallets };
    newWallets[payUngHangWallet] += amount;
    onUpdateWallets(newWallets);

    // Tạo giao dịch thu (chuyển xuống phần Thu nhập) với giá vốn
    await onAddTransaction({
      date: toLocalDateStr(new Date()),
      type: "income",
      amount,
      cost: totalCost, // Thêm giá vốn để tính lời chính xác
      wallet: payUngHangWallet,
      category: "Bán hàng trực tiếp",
      note,
      party: customerName,
    });

    // Nếu đã thanh toán đủ (paid >= total) → đánh dấu tất cả đơn của khách là đã thu
    // Lưu ngày thanh toán để tính lợi nhuận phát sinh đúng ngày thu tiền
    // CRITICAL: KHÔNG xóa data - giữ lại để xem lịch sử và số ngày ứng hàng
    const payDate = toLocalDateStr(new Date());
    const newPaid = (ungHangPaidMap[customerName] || 0) + amount;
    if (newPaid >= group.totalRevenue) {
      for (const order of group.orders) {
        onUpdateOrder(order.id, { ungHangPaid: true, ungHangPaidDate: payDate });
      }
      // KHÔNG gọi clearUngHangPaidForCustomer - giữ lại để hiển thị lịch sử
      // clearUngHangPaidForCustomer(customerName); // ĐÃ XÓA dòng này
    }

    setPayUngHangGroup(null);
    setPayUngHangAmount("");
    setPayQuantities({});
    setExpandedUngHangCustomer(null);
    
    // Tính tổng số lượng và lời
    const totalQuantity = Object.values(itemsDelta).reduce((sum, qty) => sum + qty, 0);
    const profit = amount - totalCost;
    
    alert(
      `✅ Đã thanh toán ${formatVND(amount)} vào ${walletName}\n\n` +
      `📦 Số lượng: ${totalQuantity} sản phẩm\n` +
      `💰 Giá vốn: ${formatVND(totalCost)}\n` +
      `💵 Lời: ${formatVND(profit)}`
    );
  };

  const toggleUngHangExpand = (customerName) => {
    setExpandedUngHangCustomer((prev) =>
      prev === customerName ? null : customerName
    );
  };

  // Group debts by creditor for summary display
  const groupedDebtsByCreditor = upcomingDebtsList.reduce((acc, debt) => {
    if (!acc[debt.creditor]) {
      acc[debt.creditor] = {
        creditor: debt.creditor,
        recurringDay: debt.recurringDay,
        debts: [],
        totalAmount: 0,
        remainingMonths: 0,
      };
    }
    acc[debt.creditor].debts.push(debt);
    acc[debt.creditor].totalAmount += debt.totalAmount;
    acc[debt.creditor].remainingMonths = Math.max(
      acc[debt.creditor].remainingMonths,
      debt.monthIndex
    );
    return acc;
  }, {});

  const groupedDebtsList = Object.values(groupedDebtsByCreditor).map(group => ({
    ...group,
    remainingMonths: group.debts.length, // Số tháng còn lại = số khoản nợ chưa trả
  }));

  // State for expanded creditors
  const [expandedCreditors, setExpandedCreditors] = useState(new Set());

  const toggleCreditorExpansion = (creditor) => {
    const newExpanded = new Set(expandedCreditors);
    if (newExpanded.has(creditor)) {
      newExpanded.delete(creditor);
    } else {
      newExpanded.add(creditor);
    }
    setExpandedCreditors(newExpanded);
  };

  // Bỏ qua giao dịch Ứng hàng (needsPayment) cũ - không hiển thị
  const displayTransactions = transactions.filter(
    (t) => !(t.needsPayment === true || t.status === "pending")
  );
  const sortedTransactions = [...displayTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
              Sổ Thu Chi
            </h1>
            <p className="text-emerald-500 dark:text-emerald-400 mt-1">
              Ghi nhận mọi giao dịch thực tế
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDebtModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <UserMinus size={20} />
              <span>Trả nợ</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              <span>Thêm giao dịch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ứng hàng chưa thu - Gộp theo khách hàng, ô màu đỏ trên đầu */}
      {groupedUngHang.length > 0 && (
        <div className="mb-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 font-bold text-lg mr-2">
                📦
              </span>
              <h3 className="text-red-800 dark:text-red-300 font-semibold">
                Hàng đang ứng (chưa thu tiền)
              </h3>
            </div>
            <div className="text-sm text-red-700 dark:text-red-400 font-medium">
              {groupedUngHang.length} khách hàng
            </div>
          </div>
          <div className="space-y-3">
            {groupedUngHang.map((group) => {
              const productsText = Object.entries(group.itemsMap || {})
                .map(([pid, i]) => {
                  const paid = (group.paidItems || {})[pid] || 0;
                  const rem = Math.max(0, (i.quantity || 0) - paid);
                  return `${i.name} (${rem} còn lại)`;
                })
                .join(" | ") || "-";
              const isExpanded = expandedUngHangCustomer === group.customerName;
              const isPaying = payUngHangGroup?.customerName === group.customerName;
              return (
                <div
                  key={group.customerName}
                  className="bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 rounded-lg overflow-hidden"
                >
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Khách hàng</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {group.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Sản phẩm (số lượng)</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={productsText}>
                          {productsText}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Tổng {group.paidAmount > 0 ? `(đã thu ${formatVND(group.paidAmount)})` : ""}
                        </p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatVND(group.remaining)} còn lại
                        </p>
                        {group.totalRevenue > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Tổng: {formatVND(group.totalRevenue)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => toggleUngHangExpand(group.customerName)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {isExpanded ? "Thu gọn" : "Chi tiết"}
                      </button>
                      <button
                        onClick={() => handlePayUngHang(group)}
                        disabled={group.remaining <= 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        Thanh toán
                      </button>
                    </div>
                  </div>
                  {/* Sổ xuống - Chi tiết sản phẩm + ô số lượng thanh toán */}
                  {(isExpanded || isPaying) && (
                    <div className="border-t border-red-200 dark:border-red-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Chi tiết sản phẩm:</p>
                      <div className="space-y-3 mb-4">
                        {Object.entries(group.itemsMap || {}).map(([pid, item]) => {
                          const paidQty = (group.paidItems || {})[pid] || 0;
                          const remainingQty = Math.max(0, (item.quantity || 0) - paidQty);
                          const unitPrice = item.quantity ? item.totalPrice / item.quantity : 0;
                          const qtyVal = isPaying ? (payQuantities[pid] ?? 0) : remainingQty;
                          return (
                            <div
                              key={pid}
                              className="flex flex-wrap items-center gap-3 py-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
                            >
                              <span className="font-medium text-gray-900 dark:text-white min-w-[120px]">
                                {item.name}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                x{item.quantity} = {formatVND(item.totalPrice)}
                                {paidQty > 0 && (
                                  <span className="ml-1 text-orange-600">(đã thu {paidQty})</span>
                                )}
                              </span>
                              {isPaying && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    Số lượng thanh toán:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={remainingQty}
                                    value={qtyVal}
                                    onChange={(e) => updatePayQuantity(pid, e.target.value)}
                                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                  <span className="text-xs text-gray-500">/ {remainingQty} còn lại</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {isPaying && (
                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Thanh toán tiền mặt / chuyển khoản:
                          </p>
                          <div className="flex gap-3 flex-wrap items-end">
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Số tiền thanh toán (tự tính từ số lượng trên)
                              </label>
                              <input
                                type="number"
                                value={payUngHangAmount}
                                onChange={(e) => setPayUngHangAmount(e.target.value)}
                                placeholder="Nhập số tiền..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="min-w-[120px]">
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Thu vào ví
                              </label>
                              <select
                                value={payUngHangWallet}
                                onChange={(e) => setPayUngHangWallet(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="cash">Tiền mặt</option>
                                <option value="bank">Ngân hàng</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setPayUngHangGroup(null);
                                  setPayUngHangAmount("");
                                  setPayQuantities({});
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={confirmPayUngHang}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LỊCH SỬ ỨNG HÀNG ĐÃ THANH TOÁN - Hiển thị để kiểm tra số ngày */}
      {paidUngHangOrders.length > 0 && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-lg mr-2">
                ✅
              </span>
              <h3 className="text-green-800 dark:text-green-300 font-semibold">
                Lịch sử ứng hàng đã thanh toán
              </h3>
            </div>
            <div className="text-sm text-green-700 dark:text-green-400 font-medium">
              {paidUngHangOrders.length} đơn hàng
            </div>
          </div>
          <div className="space-y-2">
            {paidUngHangOrders.map((order) => {
              const createdDate = order.createdAt ? new Date(order.createdAt) : null;
              const paidDate = order.ungHangPaidDate ? new Date(order.ungHangPaidDate) : null;
              const daysUngHang = createdDate && paidDate 
                ? Math.ceil((paidDate - createdDate) / (1000 * 60 * 60 * 24))
                : 0;
              
              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-700 border border-green-200 dark:border-green-700 rounded-lg p-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Khách hàng</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.customer || "Khách lẻ"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Sản phẩm</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {(order.items || []).map(i => `${i.name} x${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Số ngày ứng hàng</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {daysUngHang} ngày
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {createdDate?.toLocaleDateString('vi-VN')} → {paidDate?.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng tiền</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatVND(order.revenue || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Debt Payments - Grouped by Creditor */}
      {groupedDebtsList.length > 0 && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 font-bold text-lg mr-2">
                📅
              </span>
              <h3 className="text-red-800 dark:text-red-400 font-semibold">
                Nợ cần thanh toán
              </h3>
            </div>
            <div className="text-sm text-red-700 dark:text-red-400 font-medium">
              Tổng: {groupedDebtsList.length} chủ nợ
            </div>
          </div>
          <div className="space-y-2">
            {groupedDebtsList.map((group, idx) => {
              const isExpanded = expandedCreditors.has(group.creditor);
              // Find the earliest due date for this creditor
              const earliestDebt = group.debts.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
              const earliestDueDate = new Date(earliestDebt.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysUntilDue = Math.ceil((earliestDueDate - today) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntilDue < 0;
              const isToday = daysUntilDue === 0;
              
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden"
                >
                  {/* Summary Row */}
                  <div className={`p-3 ${
                    isOverdue
                      ? "bg-red-100 dark:bg-red-900/30"
                      : isToday
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : ""
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tên chủ nợ</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {group.creditor}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày định kỳ</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Ngày {group.recurringDay}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Số tháng còn lại</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {group.remainingMonths} tháng
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tổng số tiền còn nợ</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatVND(group.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => toggleCreditorExpansion(group.creditor)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown size={16} className="rotate-180" />
                              <span>Ẩn</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              <span>Xem</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-red-200 dark:border-red-800 bg-gray-50 dark:bg-gray-800/50">
                      <div className="p-3 space-y-2">
                        {group.debts.map((debt, debtIdx) => {
                          const dueDate = new Date(debt.dueDate);
                          const debtDaysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                          const debtIsOverdue = debtDaysUntilDue < 0;
                          const debtIsToday = debtDaysUntilDue === 0;
                          
                          return (
                            <div
                              key={debtIdx}
                              className={`p-3 rounded-lg ${
                                debtIsOverdue
                                  ? "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
                                  : debtIsToday
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
                                  : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      Tháng {debt.monthIndex}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Ngày {formatDate(debt.dueDate)}</span>
                                    {debtIsOverdue && (
                                      <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                        (Quá hạn {Math.abs(debtDaysUntilDue)} ngày)
                                      </span>
                                    )}
                                    {debtIsToday && (
                                      <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                                        (Hôm nay)
                                      </span>
                                    )}
                                    {!debtIsOverdue && !debtIsToday && (
                                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                                        (Còn {debtDaysUntilDue} ngày)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">
                                    {formatVND(debt.totalAmount)}
                                  </div>
                                  {debtIsOverdue || debtIsToday ? (
                                    <button
                                      onClick={() => handlePayDebt(debt)}
                                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                      Thanh toán
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed opacity-50"
                                    >
                                      Thanh toán
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ngày
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Danh mục
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ví
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Số tiền
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Lời
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ghi chú
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {transaction.type === "income" ? (
                          <>
                            <TrendingUp
                              size={16}
                              className="text-green-600 mr-2"
                            />
                            <span className="text-green-600 font-medium">
                              Thu
                            </span>
                          </>
                        ) : transaction.type === "nhap" ? (
                          <>
                            <CreditCard
                              size={16}
                              className="text-blue-600 mr-2"
                            />
                            <span className="text-blue-600 font-medium">
                              Nhập
                            </span>
                          </>
                        ) : transaction.type === "debt_payment" ? (
                          <>
                            <UserMinus
                              size={16}
                              className="text-purple-600 mr-2"
                            />
                            <span className="text-purple-600 font-medium">
                              Trả nợ
                            </span>
                          </>
                        ) : transaction.type === "ung_hang" ? (
                          <>
                            <ShoppingCart
                              size={16}
                              className="text-orange-600 mr-2"
                            />
                            <span className="text-orange-600 font-medium">
                              Ứng
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown
                              size={16}
                              className="text-red-600 mr-2"
                            />
                            <span className="text-red-600 font-medium">
                              Chi
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2 flex-wrap">
                        {transaction.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {transaction.party || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {transaction.type === "ung_hang" ? "Không" : (transaction.wallet === "cash" ? "Tiền mặt" : "Ngân hàng")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === "income" || transaction.type === "nhap"
                            ? transaction.type === "nhap"
                              ? "text-blue-600"
                              : "text-green-600"
                            : transaction.type === "debt_payment"
                              ? "text-purple-600"
                              : "text-red-600"
                        }`}
                      >
                        {(transaction.type === "income" || transaction.type === "nhap") ? "+" : "-"}
                        {formatVND(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {transaction.type === "income" ? (
                        <span className="font-semibold text-amber-600">
                          +{formatVND(transaction.amount - (transaction.cost || 0))}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {transaction.note || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(transaction)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm giao dịch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại giao dịch
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                      category: "",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi phí</option>
                  <option value="nhap">Nhập (số tiền đang có, không tính lợi nhuận)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {(categories[formData.type] || []).map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ví
                </label>
                <select
                  value={formData.wallet}
                  onChange={(e) =>
                    setFormData({ ...formData, wallet: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Ngân hàng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số tiền
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Nhập số tiền..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Ghi chú (tùy chọn)..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-0 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Repayment Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Trả nợ (Chia tách Gốc & Lãi)
              </h3>
              <button
                onClick={() => setShowDebtModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày tạo
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ví thanh toán
                </label>
                <select
                  value={formData.wallet}
                  onChange={(e) =>
                    setFormData({ ...formData, wallet: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Ngân hàng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trả cho ai (Tên chủ nợ)
                </label>
                <div className="relative creditor-input-container">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={debtData.creditor}
                      onChange={(e) => {
                        setDebtData({ ...debtData, creditor: e.target.value });
                        setShowCreditorDropdown(true);
                      }}
                      onFocus={() => setShowCreditorDropdown(true)}
                      placeholder="Ví dụ: Ngân hàng ABC, Anh Minh..."
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {savedCreditors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCreditorDropdown(!showCreditorDropdown)}
                        className="absolute right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Chọn từ danh sách đã lưu"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                  {showCreditorDropdown && (savedCreditors.length > 0 || customers.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {/* Hiển thị khách hàng trước */}
                      {customers
                        .filter((customer) =>
                          customer.name.toLowerCase().includes(debtData.creditor.toLowerCase())
                        )
                        .map((customer) => (
                          <button
                            key={`customer-${customer.id}`}
                            type="button"
                            onClick={() => {
                              setDebtData({ ...debtData, creditor: customer.name });
                              setShowCreditorDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white first:rounded-t-lg"
                          >
                            <div className="font-medium">{customer.name}</div>
                            {customer.phone && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">📞 {customer.phone}</div>
                            )}
                            {customer.bank && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                🏦 {customer.bank} {customer.accountNumber && `- STK: ${customer.accountNumber}`}
                              </div>
                            )}
                          </button>
                        ))}
                      {/* Hiển thị các chủ nợ khác (không phải khách hàng) */}
                      {savedCreditors
                        .filter((name) => {
                          const isCustomer = customers.some(c => c.name === name);
                          return !isCustomer && name.toLowerCase().includes(debtData.creditor.toLowerCase());
                        })
                        .map((creditor) => (
                          <button
                            key={creditor}
                            type="button"
                            onClick={() => {
                              setDebtData({ ...debtData, creditor });
                              setShowCreditorDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white last:rounded-b-lg"
                          >
                            {creditor}
                          </button>
                        ))}
                      {savedCreditors.filter((name) =>
                        name.toLowerCase().includes(debtData.creditor.toLowerCase())
                      ).length === 0 && customers.filter((customer) =>
                        customer.name.toLowerCase().includes(debtData.creditor.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Không tìm thấy
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {(savedCreditors.length > 0 || customers.length > 0) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Click vào biểu tượng bút để chọn từ {customers.length} khách hàng hoặc {savedCreditors.length} chủ nợ đã lưu
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số tháng còn lại
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={debtData.numberOfMonths}
                  onChange={(e) => {
                    const months = parseInt(e.target.value) || 0;
                    const newPayments = Array.from({ length: months }, (_, i) => 
                      debtData.monthlyPayments[i] || { principal: "", interest: "" }
                    );
                    setDebtData({ 
                      ...debtData, 
                      numberOfMonths: e.target.value,
                      monthlyPayments: newPayments,
                    });
                  }}
                  placeholder="Nhập số tháng (ví dụ: 10)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Số tháng còn lại cần trả nợ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày định kỳ trả nợ trong tháng
                </label>
                <select
                  value={debtData.recurringDay}
                  onChange={(e) =>
                    setDebtData({ ...debtData, recurringDay: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn ngày</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Ngày {day}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ngày trong tháng cần trả nợ (ví dụ: ngày 15)
                </p>
              </div>

              {/* Monthly Payments Input */}
              {debtData.numberOfMonths && parseInt(debtData.numberOfMonths) > 0 && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Điền số tiền cho từng tháng:
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {debtData.monthlyPayments.map((payment, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tháng {index + 1}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Tiền gốc <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={payment.principal}
                              onChange={(e) => {
                                const newPayments = [...debtData.monthlyPayments];
                                newPayments[index] = { ...newPayments[index], principal: e.target.value };
                                setDebtData({ ...debtData, monthlyPayments: newPayments });
                              }}
                              placeholder="Số tiền gốc..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Tiền lãi (tùy chọn)
                            </label>
                            <input
                              type="number"
                              value={payment.interest}
                              onChange={(e) => {
                                const newPayments = [...debtData.monthlyPayments];
                                newPayments[index] = { ...newPayments[index], interest: e.target.value };
                                setDebtData({ ...debtData, monthlyPayments: newPayments });
                              }}
                              placeholder="Số tiền lãi..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        {payment.principal && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Tổng: {formatVND(
                              (parseFloat(payment.principal) || 0) + 
                              (parseFloat(payment.interest) || 0)
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {debtData.monthlyPayments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng thanh toán tất cả các tháng:{" "}
                        <strong className="text-gray-900 dark:text-white">
                          {formatVND(
                            debtData.monthlyPayments.reduce((sum, p) => {
                              const principal = parseFloat(p.principal) || 0;
                              const interest = parseFloat(p.interest) || 0;
                              return sum + principal + interest;
                            }, 0)
                          )}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDebtModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleDebtRepayment}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Xác nhận Trả nợ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

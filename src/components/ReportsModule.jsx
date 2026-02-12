import { useState, useEffect } from "react";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, TrendingDown as TrendingDownIcon, DollarSign, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Brush,
  Legend,
  ReferenceLine,
} from "recharts";
import { getDebts } from "@/utils/localStorage";
import { User } from "lucide-react";

export default function ReportsModule({ transactions, wallets = {}, orders = [], customers = [] }) {
  const [dateRange, setDateRange] = useState("30"); // days
  const [customerReportType, setCustomerReportType] = useState("revenue"); // "revenue" or "quantity"
  const [customerReportPeriod, setCustomerReportPeriod] = useState("30"); // "7", "30", "90"
  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState("");
  
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

  // Get target earnings and days from localStorage
  const [targetEarnings, setTargetEarnings] = useState(() => {
    const saved = localStorage.getItem(getTargetStorageKey('finmaster_target_earnings'));
    return saved ? parseFloat(saved) : 0;
  });
  const [targetDays, setTargetDays] = useState(() => {
    const saved = localStorage.getItem(getTargetStorageKey('finmaster_target_days'));
    return saved ? parseFloat(saved) : 0;
  });

  const formatVND = (amount) => {
    const n = Number(amount);
    if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  };

  // Filter transactions by date range (transactions có thể undefined)
  const txList = Array.isArray(transactions) ? transactions : [];
  const getFilteredTransactions = () => {
    const now = new Date();
    const daysAgo = parseInt(dateRange) || 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return txList.filter((t) => t && t.date && new Date(t.date) >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate totals (dùng Number để tránh NaN)
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalDebtPayment = filteredTransactions
    .filter((t) => t.type === "debt_payment")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netProfit = (Number(totalIncome) || 0) - (Number(totalExpense) || 0);

  // Calculate total debt
  const debts = getDebts();
  const calculateTotalDebt = () => {
    let total = 0;
    debts.forEach(debt => {
      debt.monthlyPayments?.forEach(payment => {
        if (!payment.paid) {
          total += (payment.principal || 0) + (payment.interest || 0);
        }
      });
    });
    return total;
  };
  const totalDebt = calculateTotalDebt();

  // Calculate earnings stats (similar to WalletsModule)
  const calculateEarningsStats = () => {
    const dailyIncome = {};
    const dailyExpense = {};
    const allDates = new Set();

    filteredTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income' && amt > 0) {
        dailyIncome[t.date] = (dailyIncome[t.date] || 0) + amt;
        allDates.add(t.date);
      } else if (t.type === 'expense' && amt > 0) {
        dailyExpense[t.date] = (dailyExpense[t.date] || 0) + amt;
        allDates.add(t.date);
      }
    });

    const dailyNetProfit = {};
    allDates.forEach(date => {
      const income = dailyIncome[date] || 0;
      const expense = dailyExpense[date] || 0;
      dailyNetProfit[date] = income - expense;
    });

    const days = Object.keys(dailyNetProfit).length;
    const totalNetProfit = Object.values(dailyNetProfit).reduce((sum, val) => sum + val, 0);
    
    const dailyAverage = days > 0 ? totalNetProfit / days : 0;
    const monthlyAverage = dailyAverage * 30;

    return {
      dailyAverage,
      monthlyAverage,
    };
  };

  const earningsStats = calculateEarningsStats();

  // Get current month's days (30 or 31)
  const getDaysInCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInCurrentMonth();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Create daily data for waterfall chart
  const createDailyWaterfallData = () => {
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split("T")[0];
      
      // Get transactions for this day
      const dayTransactions = filteredTransactions.filter(
        (t) => t.date === dateStr
      );
      
      const dayIncome = dayTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const dayExpense = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const dayProfit = dayIncome - dayExpense;
      
      // Calculate cumulative values
      const prevCumulative = dailyData.length > 0 
        ? dailyData[dailyData.length - 1].cumulative 
        : 0;
      const cumulative = prevCumulative + dayProfit;
      
      dailyData.push({
        day: day,
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
        profit: dayProfit,
        cumulative: cumulative,
      });
    }
    
    return dailyData;
  };

  const dailyData = createDailyWaterfallData();

  // Transform to chart format - each day has income, expense, profit values
  const waterfallData = dailyData.map((day) => ({
    name: `${day.day}`,
    day: day.day,
    income: day.income,
    expense: day.expense,
    profit: day.profit,
    cumulative: day.cumulative,
  }));

  // Category breakdown
  const categoryBreakdown = {};
  filteredTransactions.forEach((t) => {
    if (t.type !== "debt_payment") {
      const key = `${t.type}_${t.category || "Khác"}`;
      if (!categoryBreakdown[key]) {
        categoryBreakdown[key] = {
          category: t.category || "Khác",
          type: t.type,
          amount: 0,
        };
      }
      categoryBreakdown[key].amount += (Number(t.amount) || 0);
    }
  });

  const sortedCategories = Object.values(categoryBreakdown).sort(
    (a, b) => b.amount - a.amount,
  );

  // Create target vs actual waterfall data (true waterfall chart)
  const createTargetWaterfallData = () => {
    if (targetEarnings === 0 || targetDays === 0) return [];
    
    const actualDailyAverage = earningsStats.dailyAverage;
    const projectedEarnings = actualDailyAverage * targetDays;
    const difference = projectedEarnings - targetEarnings;
    
    // Waterfall chart: each bar represents the change from previous
    // For stacked bars: start is the base, value is the height
    return [
      { 
        name: 'Bắt đầu', 
        value: 0,
        start: 0,
        type: 'start' 
      },
      { 
        name: 'Mục tiêu', 
        value: targetEarnings,
        start: 0,
        type: 'target' 
      },
      { 
        name: difference >= 0 ? 'Dư' : 'Thiếu', 
        value: Math.abs(difference),
        start: targetEarnings,
        type: difference >= 0 ? 'surplus' : 'deficit' 
      },
      { 
        name: 'Dự đoán', 
        value: 0, // This is the total, no additional bar needed
        start: projectedEarnings,
        type: 'projected',
        isTotal: true
      },
    ];
  };
  const targetWaterfallData = createTargetWaterfallData();

  // Create target vs actual comparison chart data
  const createTargetVsActualData = () => {
    if (targetEarnings === 0 || targetDays === 0) return [];
    
    // Calculate actual earnings (net profit) for the target period
    // Get transactions from the start date (targetDays ago) to now
    const now = new Date();
    const startDate = new Date(now.getTime() - targetDays * 24 * 60 * 60 * 1000);
    
    const periodTransactions = (transactions || []).filter(
      (t) => t && t.date && new Date(t.date) >= startDate
    );
    
    const periodIncome = periodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const periodExpense = periodTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const actualEarnings = periodIncome - periodExpense;
    
    return [
      {
        name: 'Mục tiêu',
        value: targetEarnings,
        type: 'target'
      },
      {
        name: 'Thực tế',
        value: actualEarnings,
        type: 'actual'
      }
    ];
  };
  const targetVsActualData = createTargetVsActualData();

  // Helper function to calculate current month debt
  const calculateCurrentMonthDebt = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let total = 0;
    debts.forEach(debt => {
      if (!debt.startDate || !debt.recurringDay) return;
      
      const startDate = new Date(debt.startDate);
      debt.monthlyPayments?.forEach((payment, monthIndex) => {
        if (payment.paid) return;
        
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + monthIndex);
        dueDate.setDate(debt.recurringDay);
        
        if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
          total += (payment.principal || 0) + (payment.interest || 0);
        }
      });
    });
    
    return total;
  };

  // Advanced Financial Analysis - Expert Insights
  const generateFinancialAnalysis = () => {
    const analysis = {
      insights: [],
      warnings: [],
      recommendations: [],
      debtAnalysis: null,
      categoryAnalysis: null,
      targetAnalysis: null,
    };

    // 1. Debt Analysis
    if (totalDebt > 0) {
      const dailyNetProfit = earningsStats.dailyAverage;
      const monthlyNetProfit = earningsStats.monthlyAverage;
      
      // Calculate days to pay off debt
      const daysToPayOffDebt = dailyNetProfit > 0 
        ? Math.ceil(totalDebt / dailyNetProfit) 
        : Infinity;
      
      // Calculate current month debt
      const currentMonthDebt = calculateCurrentMonthDebt();
      const canPayCurrentMonthDebt = monthlyNetProfit >= currentMonthDebt;
      
      // Debt-to-income ratio
      const debtToIncomeRatio = totalIncome > 0 ? (totalDebt / totalIncome) : 0;
      
      analysis.debtAnalysis = {
        totalDebt,
        daysToPayOffDebt,
        currentMonthDebt,
        canPayCurrentMonthDebt,
        monthlyNetProfit,
        debtToIncomeRatio,
      };

      if (canPayCurrentMonthDebt) {
        analysis.insights.push({
          type: 'success',
          icon: CheckCircle,
          title: 'Khả năng trả nợ tốt',
          message: `Với lợi nhuận trung bình ${formatVND(monthlyNetProfit)}/tháng, bạn có thể trả được nợ tháng này (${formatVND(currentMonthDebt)}).`,
        });
      } else {
        analysis.warnings.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Cảnh báo: Không đủ khả năng trả nợ tháng này',
          message: `Lợi nhuận trung bình ${formatVND(monthlyNetProfit)}/tháng không đủ để trả nợ ${formatVND(currentMonthDebt)}. Cần tăng thu nhập hoặc giảm chi phí.`,
        });
      }

      if (daysToPayOffDebt !== Infinity && daysToPayOffDebt <= 90) {
        analysis.insights.push({
          type: 'info',
          icon: Info,
          title: 'Tiến độ trả nợ tích cực',
          message: `Với tốc độ hiện tại, bạn có thể trả hết nợ trong ${daysToPayOffDebt} ngày (${Math.ceil(daysToPayOffDebt / 30)} tháng).`,
        });
      } else if (daysToPayOffDebt === Infinity) {
        analysis.warnings.push({
          type: 'error',
          icon: AlertCircle,
          title: 'Không thể trả nợ với tốc độ hiện tại',
          message: 'Chi phí đang lớn hơn thu nhập. Cần điều chỉnh ngay lập tức để tránh nợ tăng thêm.',
        });
      }

      if (debtToIncomeRatio > 0.5) {
        analysis.warnings.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Tỷ lệ nợ cao',
          message: `Tỷ lệ nợ/ thu nhập là ${(debtToIncomeRatio * 100).toFixed(1)}%, vượt ngưỡng an toàn 50%. Cần ưu tiên trả nợ.`,
        });
      }
    }

    // 2. Category Analysis - What's being used most
    if (sortedCategories.length > 0) {
      const topExpenseCategory = sortedCategories
        .filter(cat => cat.type === 'expense')
        .sort((a, b) => b.amount - a.amount)[0];
      
      const topIncomeCategory = sortedCategories
        .filter(cat => cat.type === 'income')
        .sort((a, b) => b.amount - a.amount)[0];

      const totalExpenseByCategory = sortedCategories
        .filter(cat => cat.type === 'expense')
        .reduce((sum, cat) => sum + cat.amount, 0);
      
      const expensePercentage = totalExpenseByCategory > 0 
        ? (topExpenseCategory?.amount / totalExpenseByCategory * 100).toFixed(1)
        : 0;

      analysis.categoryAnalysis = {
        topExpenseCategory,
        topIncomeCategory,
        expensePercentage,
      };

      if (topExpenseCategory && expensePercentage > 30) {
        analysis.insights.push({
          type: 'info',
          icon: Info,
          title: 'Phân tích chi tiêu',
          message: `"${topExpenseCategory.category}" đang chiếm ${expensePercentage}% tổng chi phí. Đây là khoản chi lớn nhất cần được theo dõi chặt chẽ.`,
        });
      }

      if (topIncomeCategory) {
        analysis.insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Nguồn thu chính',
          message: `"${topIncomeCategory.category}" là nguồn thu nhập chính (${formatVND(topIncomeCategory.amount)}). Nên tập trung phát triển nguồn này.`,
        });
      }
    }

    // 3. Target Analysis
    if (targetEarnings > 0 && targetDays > 0) {
      const targetDailyAverage = targetEarnings / targetDays;
      const actualDailyAverage = earningsStats.dailyAverage;
      const difference = actualDailyAverage - targetDailyAverage;
      const percentageDiff = targetDailyAverage > 0 
        ? ((difference / targetDailyAverage) * 100).toFixed(1)
        : 0;

      const projectedDays = actualDailyAverage > 0 
        ? Math.ceil(targetEarnings / actualDailyAverage)
        : Infinity;
      
      const daysDifference = projectedDays - targetDays;

      analysis.targetAnalysis = {
        targetDailyAverage,
        actualDailyAverage,
        difference,
        percentageDiff,
        projectedDays,
        daysDifference,
        targetEarnings,
        targetDays,
      };

      if (difference > 0) {
        analysis.insights.push({
          type: 'success',
          icon: CheckCircle,
          title: 'Vượt mục tiêu',
          message: `Bạn đang kiếm được ${formatVND(Math.abs(difference))}/ngày nhiều hơn mục tiêu (${percentageDiff}%). Tiếp tục duy trì!`,
        });
      } else if (difference < 0) {
        const reason = actualDailyAverage <= 0 
          ? 'Chi phí đang lớn hơn thu nhập'
          : actualDailyAverage < targetDailyAverage * 0.7
          ? 'Thu nhập thấp hơn đáng kể so với mục tiêu'
          : 'Cần tăng thu nhập hoặc giảm chi phí';
        
        analysis.warnings.push({
          type: 'warning',
          icon: Clock,
          title: 'Chưa đạt mục tiêu',
          message: `Bạn đang thiếu ${formatVND(Math.abs(difference))}/ngày so với mục tiêu (${Math.abs(percentageDiff)}%). ${reason}.`,
        });

        if (daysDifference > 0 && daysDifference !== Infinity) {
          analysis.recommendations.push({
            type: 'recommendation',
            icon: DollarSign,
            title: 'Khuyến nghị',
            message: `Với tốc độ hiện tại, bạn sẽ cần thêm ${daysDifference} ngày để đạt mục tiêu. Cân nhắc tăng thu nhập hoặc giảm chi phí để đạt mục tiêu đúng hạn.`,
          });
        }
      }
    }

    // 4. Cash Flow Health Analysis
    const cashFlowHealth = netProfit >= 0 ? 'healthy' : 'unhealthy';
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 1;
    
    if (cashFlowHealth === 'unhealthy') {
      analysis.warnings.push({
        type: 'error',
        icon: AlertCircle,
        title: 'Dòng tiền âm',
        message: `Chi phí đang vượt quá thu nhập ${formatVND(Math.abs(netProfit))}. Đây là dấu hiệu nguy hiểm cần được xử lý ngay.`,
      });
    }

    if (expenseRatio > 0.8 && totalIncome > 0) {
      analysis.warnings.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Tỷ lệ chi phí cao',
        message: `Chi phí chiếm ${(expenseRatio * 100).toFixed(1)}% thu nhập. Nên giảm chi phí để cải thiện lợi nhuận.`,
      });
    }

    // 5. General Recommendations
    if (totalIncome > 0 && netProfit > 0) {
      const profitMargin = (netProfit / totalIncome * 100).toFixed(1);
      
      if (profitMargin < 10) {
        analysis.recommendations.push({
          type: 'recommendation',
          icon: TrendingUp,
          title: 'Cải thiện biên lợi nhuận',
          message: `Biên lợi nhuận hiện tại là ${profitMargin}%, khá thấp. Nên tìm cách tăng giá bán hoặc giảm chi phí để cải thiện.`,
        });
      }
    }

    // 6. Daily Pattern Analysis
    const daysWithProfit = dailyData.filter(d => d.profit > 0).length;
    const profitDaysRatio = (daysWithProfit / daysInMonth * 100).toFixed(1);
    
    if (profitDaysRatio < 50) {
      analysis.warnings.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Tần suất lợi nhuận thấp',
        message: `Chỉ có ${profitDaysRatio}% số ngày có lợi nhuận dương. Cần cải thiện tính nhất quán trong hoạt động kinh doanh.`,
      });
    }

    return analysis;
  };

  const financialAnalysis = generateFinancialAnalysis();

  // Calculate customer report data
  const calculateCustomerReport = () => {
    if (!selectedCustomerForReport) return null;

    const now = new Date();
    const daysAgo = parseInt(customerReportPeriod);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter orders by customer and date
    const customerOrders = orders.filter((order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(order.date || order.id);
      const customerMatch = 
        order.customer === selectedCustomerForReport || 
        order.customerId === parseInt(selectedCustomerForReport);
      return customerMatch && orderDate >= startDate;
    });

    if (customerOrders.length === 0) return null;

    let totalValue = 0;
    let totalQuantity = 0;

    customerOrders.forEach((order) => {
      if (customerReportType === "revenue") {
        totalValue += order.revenue || 0;
      } else {
        // Count total quantity from items
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            totalQuantity += item.quantity || 0;
          });
        }
      }
    });

    // Create daily breakdown
    const dailyData = {};
    customerOrders.forEach((order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(order.date || order.id);
      const dateStr = orderDate.toISOString().split("T")[0];
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          revenue: 0,
          quantity: 0,
        };
      }

      dailyData[dateStr].revenue += order.revenue || 0;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          dailyData[dateStr].quantity += item.quantity || 0;
        });
      }
    });

    const chartData = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((day) => ({
        date: day.date,
        label: new Date(day.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        value: customerReportType === "revenue" ? day.revenue : day.quantity,
      }));

    return {
      totalValue: customerReportType === "revenue" ? totalValue : totalQuantity,
      totalOrders: customerOrders.length,
      chartData,
    };
  };

  const customerReportData = calculateCustomerReport();

  // Top 5 khách hàng - hiện luôn, biểu đồ ngang 5 dòng
  const calculateTopCustomersData = () => {
    const now = new Date();
    const daysAgo = parseInt(customerReportPeriod) || 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const orderList = Array.isArray(orders) ? orders : [];

    const byCustomer = {};
    orderList.forEach((order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(order.date || order.id);
      if (orderDate < startDate) return;
      const name = order.customer || order.customerName || "Khách lẻ";
      if (!byCustomer[name]) byCustomer[name] = { name, revenue: 0, quantity: 0, orders: 0 };
      byCustomer[name].revenue += Number(order.revenue) || 0;
      byCustomer[name].orders += 1;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          byCustomer[name].quantity += Number(item.quantity) || 0;
        });
      }
    });

    return Object.values(byCustomer)
      .sort((a, b) => (customerReportType === "revenue" ? b.revenue - a.revenue : b.quantity - a.quantity))
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        value: customerReportType === "revenue" ? c.revenue : c.quantity,
        orders: c.orders,
      }));
  };

  const topCustomersData = calculateTopCustomersData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            Ngày {data.day}
          </p>
          {data.income > 0 && (
            <p className="text-sm text-green-600">
              Thu: <span className="font-semibold">{formatVND(data.income)}</span>
            </p>
          )}
          {data.expense > 0 && (
            <p className="text-sm text-red-600">
              Chi: <span className="font-semibold">{formatVND(data.expense)}</span>
            </p>
          )}
          <p className={`text-sm ${data.profit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            Lợi nhuận: <span className="font-semibold">{formatVND(data.profit)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            Tích lũy: <span className="font-semibold">{formatVND(data.cumulative)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
            Báo cáo
          </h1>
          <p className="text-emerald-500 dark:text-emerald-400 mt-1">
            Phân tích tài chính dựa trên dòng tiền thực tế
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-3">
          <Calendar size={20} className="text-emerald-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
            <option value="90">90 ngày qua</option>
            <option value="365">1 năm qua</option>
            <option value="99999">Tất cả</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng Thu nhập
            </h3>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatVND(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng Chi phí
            </h3>
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatVND(totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Lợi nhuận ròng
            </h3>
            <TrendingUp
              size={20}
              className={netProfit >= 0 ? "text-green-600" : "text-red-600"}
            />
          </div>
          <p
            className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatVND(netProfit)}
          </p>
        </div>
      </div>

      {/* Customer Report Section - Top 5 hiện luôn + chi tiết khi chọn */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={24} className="text-blue-600" />
            Báo cáo Khách hàng
          </h2>
        </div>

        {/* Filters - Thời gian + Loại */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thời gian
            </label>
            <select
              value={customerReportPeriod}
              onChange={(e) => setCustomerReportPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">7 ngày qua</option>
              <option value="30">30 ngày qua</option>
              <option value="90">90 ngày qua</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại báo cáo
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="revenue"
                  checked={customerReportType === "revenue"}
                  onChange={(e) => setCustomerReportType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Tổng tiền</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="quantity"
                  checked={customerReportType === "quantity"}
                  onChange={(e) => setCustomerReportType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Số sản phẩm</span>
              </label>
            </div>
          </div>
        </div>

        {/* Biểu đồ ngang Top 5 khách hàng - hiện luôn */}
        {topCustomersData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 khách hàng
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis type="number" tickFormatter={(v) => new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v)} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-white">{d.name}</p>
                            <p className="text-sm">{customerReportType === "revenue" ? formatVND(d.value) : `${d.value} SP`}</p>
                            <p className="text-xs text-gray-500">{d.orders} đơn hàng</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chọn khách để xem chi tiết */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Xem chi tiết khách hàng (tùy chọn)
          </label>
          <select
            value={selectedCustomerForReport}
            onChange={(e) => setSelectedCustomerForReport(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Không chọn --</option>
            {(customers || []).map((customer) => (
              <option key={customer.id} value={customer.name}>
                {customer.name} {customer.phone && `(${customer.phone})`}
              </option>
            ))}
          </select>
        </div>

        {/* Report Results - Chi tiết khi chọn khách */}
        {selectedCustomerForReport && customerReportData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  {customerReportType === "revenue" ? "Tổng tiền bán" : "Tổng sản phẩm"}
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {customerReportType === "revenue" 
                    ? formatVND(customerReportData.totalValue)
                    : `${customerReportData.totalValue.toLocaleString("vi-VN")} sản phẩm`}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                  Số đơn hàng
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {customerReportData.totalOrders}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                  Trung bình/đơn
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {customerReportData.totalOrders > 0
                    ? customerReportType === "revenue"
                      ? formatVND(customerReportData.totalValue / customerReportData.totalOrders)
                      : `${Math.round(customerReportData.totalValue / customerReportData.totalOrders).toLocaleString("vi-VN")} SP`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Chart */}
            {customerReportData.chartData && customerReportData.chartData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Biểu đồ theo ngày
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerReportData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: "#4b5563", fontSize: 11 }}
                      />
                      <YAxis 
                        tick={{ fill: "#4b5563", fontSize: 11 }}
                        tickFormatter={(value) => 
                          customerReportType === "revenue" 
                            ? formatVND(value).replace(" ₫", "K")
                            : value
                        }
                      />
                      <Tooltip
                        formatter={(value) => 
                          customerReportType === "revenue"
                            ? formatVND(value)
                            : `${value} sản phẩm`
                        }
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={customerReportType === "revenue" ? "#3b82f6" : "#10b981"}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : selectedCustomerForReport ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Không có dữ liệu cho khách hàng này trong khoảng thời gian đã chọn
          </div>
        ) : topCustomersData.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Chưa có đơn hàng trong khoảng thời gian đã chọn
          </div>
        ) : null}
      </div>

      {/* Waterfall Chart - Professional Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Biểu đồ thác nước - Dòng tiền thực tế ({daysInMonth} ngày trong tháng)
        </h2>
        <div className="h-[600px] overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%" minWidth={daysInMonth * 25}>
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              barCategoryGap="1%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                axisLine={true}
                tickLine={false}
                tick={{ fill: "#4b5563", fontSize: 11, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                label={{ value: 'Ngày trong tháng', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: 12 } }}
              />
              <YAxis
                axisLine={true}
                tickLine={false}
                tick={{ fill: "#4b5563", fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value === 0) return '0';
                  return new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value);
                }}
                label={{ value: 'Số tiền (VNĐ)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                domain={[
                  (dataMin) => {
                    // Find the absolute maximum value across all data points
                    const allValues = waterfallData.flatMap(d => [
                      d.income || 0,
                      d.expense || 0,
                      d.profit || 0,
                      Math.abs(d.profit) || 0
                    ]);
                    const maxAbsValue = Math.max(...allValues.map(Math.abs));
                    // Add 30% padding below (for negative values)
                    return -maxAbsValue * 1.3;
                  },
                  (dataMax) => {
                    // Find the absolute maximum value across all data points
                    const allValues = waterfallData.flatMap(d => [
                      d.income || 0,
                      d.expense || 0,
                      d.profit || 0,
                      Math.abs(d.profit) || 0
                    ]);
                    const maxAbsValue = Math.max(...allValues.map(Math.abs));
                    // Add 30% padding above the highest value
                    return maxAbsValue * 1.3;
                  }
                ]}
                allowDataOverflow={false}
              />
              {/* Zero reference line */}
              <ReferenceLine 
                y={0} 
                stroke="#6b7280" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "0", position: "left", fill: "#6b7280", fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              {/* Income bars - cột mỏng sát nhau theo ngày */}
              <Bar 
                dataKey="income" 
                fill="#10B981"
                radius={[2, 2, 0, 0]}
                barSize={4}
              />
              {/* Expense bars */}
              <Bar 
                dataKey="expense" 
                fill="#EF4444"
                radius={[2, 2, 0, 0]}
                barSize={4}
              />
              {/* Profit bars */}
              <Bar 
                dataKey="profit" 
                radius={[2, 2, 0, 0]}
                barSize={4}
              >
                {waterfallData.map((entry, index) => (
                  <Cell 
                    key={`profit-cell-${index}`} 
                    fill={entry.profit >= 0 ? "#3B82F6" : "#F59E0B"} 
                  />
                ))}
              </Bar>
              {/* Brush for zoom/pan */}
              <Brush
                dataKey="name"
                height={30}
                stroke="#6366f1"
                fill="#e0e7ff"
                tickFormatter={(value) => `Ngày ${value}`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-8 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Thu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Chi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Lợi nhuận (+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Lợi nhuận (-)</span>
          </div>
        </div>
      </div>

      {/* Target vs Actual Waterfall Chart */}
      {targetWaterfallData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Biểu đồ thác nước - Mục tiêu vs Dự đoán
          </h2>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetWaterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("vi-VN", {
                      notation: "compact",
                    }).format(value)
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            {data.name}
                          </p>
                          {data.type !== 'start' && data.type !== 'projected' && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Thay đổi: <span className="font-semibold">{formatVND(data.value)}</span>
                            </p>
                          )}
                          {data.type === 'projected' && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Tổng dự đoán: <span className="font-semibold">{formatVND(data.start)}</span>
                            </p>
                          )}
                          {data.type !== 'projected' && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Tích lũy: <span className="font-semibold">{formatVND(data.start + data.value)}</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Waterfall bars - stacked bars to create waterfall effect */}
                <Bar 
                  dataKey="start" 
                  stackId="base"
                  fill="transparent"
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  stackId="waterfall"
                >
                  {targetWaterfallData.map((entry, index) => (
                    <Cell 
                      key={`target-cell-${index}`} 
                      fill={
                        entry.type === 'start' ? '#E5E7EB' :
                        entry.type === 'target' ? '#3B82F6' :
                        entry.type === 'projected' ? '#10B981' :
                        entry.type === 'surplus' ? '#84CC16' : '#EF4444'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Mục tiêu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Dự đoán</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-lime-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Dư</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Thiếu</span>
            </div>
          </div>
        </div>
      )}

      {/* Target vs Actual Comparison Chart */}
      {targetVsActualData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            So sánh Mục tiêu vs Thực tế
          </h2>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetVsActualData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 14, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("vi-VN", {
                      notation: "compact",
                    }).format(value)
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            {data.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Số tiền: <span className="font-semibold">{formatVND(data.value)}</span>
                          </p>
                          {targetDays > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Trong: <span className="font-semibold">{targetDays} ngày</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  barSize={80}
                >
                  {targetVsActualData.map((entry, index) => (
                    <Cell 
                      key={`target-vs-actual-cell-${index}`} 
                      fill={entry.type === 'target' ? '#10B981' : '#3B82F6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Mục tiêu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Thực tế</span>
            </div>
          </div>
          {targetVsActualData.length === 2 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chênh lệch: 
                <span className={`font-semibold ml-2 ${
                  targetVsActualData[1].value >= targetVsActualData[0].value 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {targetVsActualData[1].value >= targetVsActualData[0].value ? '+' : ''}
                  {formatVND(targetVsActualData[1].value - targetVsActualData[0].value)}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ({targetVsActualData[1].value >= targetVsActualData[0].value ? 'Đạt' : 'Chưa đạt'} mục tiêu)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Phân tích theo Danh mục
          </h2>
          <div className="space-y-3">
            {sortedCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có dữ liệu
              </p>
            ) : (
              sortedCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        cat.type === "income" ? "bg-green-600" : "bg-red-600"
                      }`}
                    />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {cat.category}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      cat.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {cat.type === "income" ? "+" : "-"}
                    {formatVND(cat.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Thông tin bổ sung
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                Số giao dịch thu:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredTransactions.filter((t) => t.type === "income").length}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                Số giao dịch chi:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {
                  filteredTransactions.filter((t) => t.type === "expense")
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                Trả nợ gốc (tổng):
              </span>
              <span className="font-semibold text-purple-600">
                {formatVND(totalDebtPayment)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Thu nhập trung bình/ngày:
              </span>
              <span className="font-semibold text-green-600">
                {formatVND((Number(totalIncome) || 0) / Math.max(1, parseInt(dateRange) || 30))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Financial Analysis - Expert Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phân tích Dữ liệu Tài chính
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Nhận định và khuyến nghị từ chuyên gia quản lý dòng tiền
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Insights */}
          {financialAnalysis.insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Nhận định tích cực
              </h3>
              {financialAnalysis.insights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={`insight-${idx}`}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Warnings */}
          {financialAnalysis.warnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Cảnh báo và Lưu ý
              </h3>
              {financialAnalysis.warnings.map((warning, idx) => {
                const Icon = warning.icon;
                const bgColor = warning.type === 'error' ? 'border-red-500' : 'border-orange-500';
                const iconColor = warning.type === 'error' ? 'text-red-600' : 'text-orange-600';
                return (
                  <div
                    key={`warning-${idx}`}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${bgColor} shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {warning.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {warning.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations */}
          {financialAnalysis.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Khuyến nghị Hành động
              </h3>
              {financialAnalysis.recommendations.map((rec, idx) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={`rec-${idx}`}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {rec.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Debt Analysis Summary */}
          {financialAnalysis.debtAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Tóm tắt Phân tích Nợ
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tổng nợ</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatVND(financialAnalysis.debtAnalysis.totalDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nợ tháng này</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatVND(financialAnalysis.debtAnalysis.currentMonthDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày trả hết</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {financialAnalysis.debtAnalysis.daysToPayOffDebt === Infinity 
                      ? 'Không xác định' 
                      : `${financialAnalysis.debtAnalysis.daysToPayOffDebt} ngày`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ nợ/thu</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {(financialAnalysis.debtAnalysis.debtToIncomeRatio * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Target Analysis Summary */}
          {financialAnalysis.targetAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Phân tích Mục tiêu
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mục tiêu TB/ngày</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatVND(financialAnalysis.targetAnalysis.targetDailyAverage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thực tế TB/ngày</p>
                  <p className={`text-sm font-semibold ${
                    financialAnalysis.targetAnalysis.actualDailyAverage >= financialAnalysis.targetAnalysis.targetDailyAverage
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatVND(financialAnalysis.targetAnalysis.actualDailyAverage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chênh lệch</p>
                  <p className={`text-sm font-semibold ${
                    financialAnalysis.targetAnalysis.difference >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {financialAnalysis.targetAnalysis.difference >= 0 ? '+' : ''}
                    {formatVND(financialAnalysis.targetAnalysis.difference)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày dự kiến đạt</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {financialAnalysis.targetAnalysis.projectedDays === Infinity 
                      ? 'Không xác định' 
                      : `${financialAnalysis.targetAnalysis.projectedDays} ngày`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📊 Về báo cáo này
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Báo cáo này được tính toán dựa trên <strong>Sổ Thu Chi</strong> (dòng
          tiền thực tế vào/ra). Không bao gồm đơn hàng chưa thu tiền từ các sàn
          TMĐT. Trả nợ gốc không được tính là chi phí mà chỉ giảm tài sản.
        </p>
      </div>
    </div>
  );
}

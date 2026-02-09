import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function PLAnalysisModule({ salesData, expensesData }) {
  const formatVND = (amount) => {
    const n = Number(amount);
    if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  };

  // Calculate P&L components (safeguard NaN)
  const completedOrders = salesData?.completedOrders || [];
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );
  const cogs = (Number(totalRevenue) || 0) * 0.6; // 60% as COGS

  const expList = Array.isArray(expensesData) ? expensesData : [];
  const operatingExpenses = expList
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const financialInterest = expList
    .filter((e) => e.type === "debt" && e.canSplit)
    .reduce((sum, e) => sum + (Number(e.amount) || 0) * 0.2, 0);

  const netProfit = (Number(totalRevenue) || 0) - cogs - operatingExpenses - financialInterest;

  // Waterfall chart data
  const waterfallData = [
    {
      name: "Doanh thu",
      value: totalRevenue,
      cumulative: totalRevenue,
      color: "#3B82F6",
    },
    {
      name: "Giá vốn",
      value: -cogs,
      cumulative: totalRevenue - cogs,
      color: "#EF4444",
    },
    {
      name: "Chi phí VH",
      value: -operatingExpenses,
      cumulative: totalRevenue - cogs - operatingExpenses,
      color: "#EF4444",
    },
    {
      name: "Lãi vay",
      value: -financialInterest,
      cumulative: netProfit,
      color: "#EF4444",
    },
    {
      name: "Lợi nhuận",
      value: netProfit,
      cumulative: netProfit,
      color: netProfit >= 0 ? "#10B981" : "#EF4444",
    },
  ];

  // P&L breakdown table data
  const plBreakdown = [
    {
      category: "Doanh thu",
      amount: totalRevenue,
      percentage: 100,
      type: "revenue",
    },
    {
      category: "Giá vốn hàng bán",
      amount: cogs,
      percentage: totalRevenue > 0 ? (cogs / totalRevenue) * 100 : 0,
      type: "expense",
    },
    {
      category: "Lợi nhuận gộp",
      amount: totalRevenue - cogs,
      percentage: totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue) * 100 : 0,
      type: "profit",
    },
    {
      category: "Chi phí vận hành",
      amount: operatingExpenses,
      percentage: totalRevenue > 0 ? (operatingExpenses / totalRevenue) * 100 : 0,
      type: "expense",
    },
    {
      category: "Chi phí tài chính (Lãi vay)",
      amount: financialInterest,
      percentage: totalRevenue > 0 ? (financialInterest / totalRevenue) * 100 : 0,
      type: "expense",
    },
    {
      category: "Lợi nhuận ròng",
      amount: netProfit,
      percentage: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      type: netProfit >= 0 ? "profit" : "loss",
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Giá trị:{" "}
            <span className="font-semibold">
              {formatVND(Math.abs(data.value))}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tích lũy:{" "}
            <span className="font-semibold">{formatVND(data.cumulative)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Phân tích Lỗ Lãi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Hiểu rõ nguồn gốc lợi nhuận của doanh nghiệp
        </p>
      </div>

      {/* Waterfall Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Biểu đồ thác nước - Dòng chảy lợi nhuận
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                tickFormatter={(value) => formatVND(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cumulative" radius={[8, 8, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Bảng phân tích chi tiết
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Hạng mục
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Số tiền
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  % Doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {plBreakdown.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    item.category.includes("Lợi nhuận") ? "font-semibold" : ""
                  }`}
                >
                  <td
                    className={`px-6 py-4 text-gray-900 dark:text-white ${
                      item.category.includes("Lợi nhuận") ? "font-semibold" : ""
                    }`}
                  >
                    {item.category}
                  </td>
                  <td
                    className={`px-6 py-4 text-right ${
                      item.type === "revenue" || item.type === "profit"
                        ? "text-green-600 font-semibold"
                        : item.type === "loss"
                          ? "text-red-600 font-semibold"
                          : "text-red-600"
                    }`}
                  >
                    {item.type === "expense" ? "-" : ""}
                    {formatVND(item.amount)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right ${
                      item.type === "revenue" || item.type === "profit"
                        ? "text-green-600"
                        : item.type === "loss"
                          ? "text-red-600"
                          : "text-red-600"
                    }`}
                  >
                    {item.type === "expense" ? "-" : ""}
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Biên lợi nhuận gộp
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {(((totalRevenue - cogs) / totalRevenue) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Biên lợi nhuận ròng
          </h3>
          <p
            className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {((netProfit / totalRevenue) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Tổng chi phí
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatVND(cogs + operatingExpenses + financialInterest)}
          </p>
        </div>
      </div>
    </div>
  );
}

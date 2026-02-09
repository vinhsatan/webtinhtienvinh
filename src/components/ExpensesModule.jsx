import { useState } from "react";
import { Calendar, DollarSign, X } from "lucide-react";

export default function ExpensesModule({ expenses, onPayExpense }) {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const handlePayClick = (expense) => {
    setSelectedExpense(expense);
    if (expense.canSplit) {
      setPrincipal("");
      setInterest("");
      setShowSplitModal(true);
    } else {
      onPayExpense(expense.id, { amount: expense.amount });
    }
  };

  const handleSplitPayment = () => {
    const principalAmount = parseFloat(principal) || 0;
    const interestAmount = parseFloat(interest) || 0;
    const total = principalAmount + interestAmount;

    if (total !== selectedExpense.amount) {
      alert(`Tổng số tiền phải bằng ${formatVND(selectedExpense.amount)}`);
      return;
    }

    onPayExpense(selectedExpense.id, {
      principal: principalAmount,
      interest: interestAmount,
    });

    setShowSplitModal(false);
    setSelectedExpense(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chi phí & Định kỳ
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quản lý các khoản chi phí và nghĩa vụ hàng tháng
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Khoản mục
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Số tiền
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ngày đến hạn
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-lg ${
                          expense.type === "debt"
                            ? "bg-red-100 dark:bg-red-900/20"
                            : "bg-blue-100 dark:bg-blue-900/20"
                        } flex items-center justify-center mr-3`}
                      >
                        <DollarSign
                          size={20}
                          className={
                            expense.type === "debt"
                              ? "text-red-600"
                              : "text-blue-600"
                          }
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {expense.name}
                        </p>
                        {expense.canSplit && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Có thể chia tách
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        expense.type === "debt"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {expense.type === "debt" ? "Nợ" : "Chi phí"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatVND(expense.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {expense.dueDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {!expense.paid ? (
                      <button
                        onClick={() => handlePayClick(expense)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Thanh toán
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Đã thanh toán
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tổng chi phí tháng này
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {formatVND(
              expenses
                .filter((e) => !e.paid)
                .reduce((sum, e) => sum + e.amount, 0),
            )}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Đã thanh toán
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatVND(
              expenses
                .filter((e) => e.paid)
                .reduce((sum, e) => sum + e.amount, 0),
            )}
          </p>
        </div>
      </div>

      {/* Split Payment Modal */}
      {showSplitModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Chia tách thanh toán
              </h3>
              <button
                onClick={() => setShowSplitModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>{selectedExpense.name}</strong>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Tổng số tiền:{" "}
                <strong>{formatVND(selectedExpense.amount)}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiền gốc (Gốc) - Giảm nợ
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="Nhập số tiền gốc..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Được tính là Giảm Nợ (không phải chi phí)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiền lãi (Lãi) - Chi phí tài chính
                </label>
                <input
                  type="number"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="Nhập số tiền lãi..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Được tính là Chi phí Tài chính
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tổng:
                  </span>
                  <span
                    className={`font-semibold ${
                      (parseFloat(principal) || 0) +
                        (parseFloat(interest) || 0) ===
                      selectedExpense.amount
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatVND(
                      (parseFloat(principal) || 0) +
                        (parseFloat(interest) || 0),
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSplitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSplitPayment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Search, Plus, Trash2, Save, ChevronDown } from "lucide-react";

export default function SalesPOSModule({
  products,
  templates,
  onSaveTemplate,
}) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const loadTemplate = (template) => {
    setCart(template.items.map((item) => ({ ...item })));
    setShowTemplateDropdown(false);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim() && cart.length > 0) {
      onSaveTemplate({
        id: Date.now(),
        name: templateName,
        items: cart.map((item) => ({ ...item })),
      });
      setTemplateName("");
      setShowSaveModal(false);
    }
  };

  const calculateTotals = () => {
    const revenue = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const cost = revenue * 0.6; // 60% of revenue as cost
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  };

  const totals = calculateTotals();
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left: Product List */}
      <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Danh sách sản phẩm
          </h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-3 break-words min-h-[3em] overflow-hidden" title={product.name || product.productName || ''}>
                {product.name || product.productName || 'Sản phẩm'}
              </h3>
              <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {formatVND(product.price)}
              </p>
              <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center transition-colors">
                <Plus size={16} className="mr-1" />
                Thêm
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 bg-gray-50 dark:bg-gray-900 p-6 flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Đơn hàng hiện tại
          </h2>

          {/* Template Dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span>Chọn Mẫu nhập nhanh</span>
              <ChevronDown size={20} />
            </button>

            {showTemplateDropdown && templates.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {template.items.length} sản phẩm
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Chưa có sản phẩm trong giỏ hàng
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-gray-900 dark:text-white font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    {formatVND(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unit Economics Summary */}
        {cart.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3 mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Tóm tắt đơn hàng
            </h3>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Doanh thu:</span>
              <span className="font-semibold">{formatVND(totals.revenue)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Giá vốn (ước tính):</span>
              <span className="font-semibold">{formatVND(totals.cost)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Lãi ước tính:
                </span>
                <span
                  className={`font-bold text-lg ${
                    totals.margin < 10 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatVND(totals.profit)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Biên lợi nhuận:
                </span>
                <span
                  className={`text-sm font-semibold ${
                    totals.margin < 10 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {totals.margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save Template Button */}
        {cart.length > 0 && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <Save size={20} className="mr-2" />
            Lưu đơn này làm Mẫu
          </button>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Lưu mẫu đơn hàng
            </h3>
            <input
              type="text"
              placeholder="Nhập tên mẫu..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

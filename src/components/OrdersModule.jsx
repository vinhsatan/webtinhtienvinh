import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { getProducts, toLocalDateStr } from "@/utils/localStorage";

export default function OrdersModule({
  products,
  templates,
  customers,
  transactions = [],
  orders = [],
  onAddOrder,
  onDeleteOrder,
  onSaveTemplate,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddTransaction,
  onUpdateTransaction,
  onUpdateWallets,
  wallets,
}) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    cost: "",              // Vốn
    price: "",              // Bán lẻ
    wholesalePrice: "",     // Bán sỉ (tiền mặt)
    tiktokPrice: "",        // TikTok nhận về
    shopeePrice: "",        // Shopee nhận về
    quantity: "",           // Số lượng trong kho
  });
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", bank: "", accountNumber: "", defaultPriceType: "cash" });
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [banks, setBanks] = useState(["Vietcombank", "BIDV", "VietinBank", "Agribank", "Techcombank", "ACB", "TPBank", "VPBank", "MBBank", "SHB"]);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  // Determine price based on customer and payment method
  const getProductPrice = (product, customer, paymentMethod) => {
    // If customer has defaultPriceType "wholesale" and payment is cash → wholesale price
    if (customer?.defaultPriceType === "wholesale" && paymentMethod === "cash") {
      return product.wholesalePrice || product.price;
    }
    // Legacy: If customer is "Dũng" and payment is cash → wholesale price
    if (customer?.name === "Dũng" && paymentMethod === "cash") {
      return product.wholesalePrice || product.price;
    }
    // If payment is TikTok → TikTok price
    if (paymentMethod === "tiktok") {
      return product.tiktokPrice || product.price;
    }
    // If payment is Shopee → Shopee price
    if (paymentMethod === "shopee") {
      return product.shopeePrice || product.price;
    }
    // Ứng hàng: dùng giá như tiền mặt (retail/wholesale theo khách)
    if (paymentMethod === "ung_hang") {
      if (customer?.defaultPriceType === "wholesale") {
        return product.wholesalePrice || product.price;
      }
      if (customer?.name === "Dũng") {
        return product.wholesalePrice || product.price;
      }
      return product.price;
    }
    // Default: retail price
    return product.price;
  };

  const addToCart = (product) => {
    const price = getProductPrice(product, selectedCustomer, paymentMethod);
    const existingItem = cart.find((item) => item.id === product.id && item.salePrice === price);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.salePrice === price
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        salePrice: price,  // Giá bán thực tế
        originalPrice: product.price  // Giá gốc để hiển thị
      }]);
    }
  };

  const removeFromCart = (productId, salePrice) => {
    setCart(cart.filter((item) => !(item.id === productId && (item.salePrice || item.price) === salePrice)));
  };

  const matchCartItem = (item, productId, salePrice) =>
    item.id === productId && (item.salePrice || item.price) === salePrice;

  const updateQuantity = (productId, quantity, salePrice) => {
    if (quantity <= 0) {
      if (salePrice != null) removeFromCart(productId, salePrice);
      else setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          salePrice != null
            ? (matchCartItem(item, productId, salePrice) ? { ...item, quantity } : item)
            : (item.id === productId ? { ...item, quantity } : item),
        ),
      );
    }
  };

  // Update cart prices when customer or payment method changes
  useEffect(() => {
    if (cart.length > 0) {
      setCart(
        cart.map((item) => {
          const product = products.find((p) => p.id === item.id);
          if (product) {
            const newPrice = getProductPrice(product, selectedCustomer, paymentMethod);
            return { ...item, salePrice: newPrice };
          }
          return item;
        }),
      );
    }
  }, [selectedCustomer, paymentMethod]);

  // Allow manual price adjustment in cart
  const updateCartItemPrice = (productId, newPrice, currentSalePrice) => {
    const val = parseFloat(newPrice);
    const salePrice = !isNaN(val) && val > 0 ? val : (currentSalePrice ?? 0);
    setCart(
      cart.map((item) =>
        currentSalePrice != null
          ? (matchCartItem(item, productId, currentSalePrice) ? { ...item, salePrice } : item)
          : (item.id === productId ? { ...item, salePrice: salePrice || item.price } : item),
      ),
    );
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || "",
      cost: product.cost || "",
      price: product.price || "",
      wholesalePrice: product.wholesalePrice || "",
      tiktokPrice: product.tiktokPrice || "",
      shopeePrice: product.shopeePrice || "",
      quantity: product.quantity || "",
    });
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = () => {
    if (editingProduct && newProduct.name && newProduct.cost) {
      onUpdateProduct(editingProduct.id, {
        name: newProduct.name,
        cost: parseFloat(newProduct.cost) || 0,
        price: parseFloat(newProduct.price) || parseFloat(newProduct.cost) * 2,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || null,
        tiktokPrice: parseFloat(newProduct.tiktokPrice) || null,
        shopeePrice: parseFloat(newProduct.shopeePrice) || null,
        quantity: parseFloat(newProduct.quantity) || 0,
      });
      setNewProduct({ 
        name: "", 
        cost: "", 
        price: "", 
        wholesalePrice: "", 
        tiktokPrice: "", 
        shopeePrice: "", 
        quantity: "" 
      });
      setEditingProduct(null);
      setShowEditProductModal(false);
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.cost) {
      onAddProduct({
        name: newProduct.name,
        cost: parseFloat(newProduct.cost) || 0,
        price: parseFloat(newProduct.price) || parseFloat(newProduct.cost) * 2, // Default: 2x cost
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || null,
        tiktokPrice: parseFloat(newProduct.tiktokPrice) || null,
        shopeePrice: parseFloat(newProduct.shopeePrice) || null,
        quantity: parseFloat(newProduct.quantity) || 0,
      });
      setNewProduct({ 
        name: "", 
        cost: "", 
        price: "", 
        wholesalePrice: "", 
        tiktokPrice: "", 
        shopeePrice: "", 
        quantity: "" 
      });
      setShowAddProductModal(false);
    }
  };

  const handleAddCustomer = () => {
    if (newCustomer.name) {
      const customer = onAddCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        bank: newCustomer.bank || "",
        accountNumber: newCustomer.accountNumber || "",
        defaultPriceType: newCustomer.defaultPriceType || "cash",
      });
      setSelectedCustomer(customer);
      // Tự động set paymentMethod theo defaultPriceType
      if (customer?.defaultPriceType) {
        const pm = customer.defaultPriceType === "wholesale" || customer.defaultPriceType === "credit" ? "cash" : customer.defaultPriceType;
        setPaymentMethod(pm);
      }
      setNewCustomer({ name: "", phone: "", bank: "", accountNumber: "", defaultPriceType: "cash" });
      setShowAddCustomerModal(false);
    }
  };

  const handleUpdateCustomer = () => {
    if (editingCustomer && newCustomer.name) {
      onUpdateCustomer(editingCustomer.id, {
        name: newCustomer.name,
        phone: newCustomer.phone,
        bank: newCustomer.bank || "",
        accountNumber: newCustomer.accountNumber || "",
        defaultPriceType: newCustomer.defaultPriceType || "cash",
      });
      // Cập nhật selectedCustomer nếu đang chọn khách hàng này
      if (selectedCustomer?.id === editingCustomer.id) {
        const updatedCustomer = customers.find(c => c.id === editingCustomer.id);
        if (updatedCustomer) {
          setSelectedCustomer({ ...updatedCustomer, ...newCustomer });
          // Cập nhật paymentMethod nếu cần
          if (newCustomer.defaultPriceType) {
            const pm = newCustomer.defaultPriceType === "wholesale" || newCustomer.defaultPriceType === "credit" ? "cash" : newCustomer.defaultPriceType;
            setPaymentMethod(pm);
          }
        }
      }
      setNewCustomer({ name: "", phone: "", bank: "", accountNumber: "", defaultPriceType: "cash" });
      setEditingCustomer(null);
      setShowEditCustomerModal(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      alert("Vui lòng thêm sản phẩm vào đơn hàng!");
      return;
    }

    // For TMDT platforms (tiktok, shopee, ecommerce), customer is optional
    // For cash, bank, ung_hang, customer is required
    const isTMDT = paymentMethod === "tiktok" || paymentMethod === "shopee" || paymentMethod === "ecommerce";
    
    console.log("[DEBUG] Payment Method:", paymentMethod, "Is TMDT:", isTMDT);
    
    // Get customer: for TMDT use default, for others require selection
    let customer = selectedCustomer;
    if (!customer) {
      if (isTMDT) {
        // For TMDT, use default customer object
        customer = {
          id: "temp-tmdt",
          name: "Khách lẻ - TMDT",
        };
        console.log("[DEBUG] Created default TMDT customer");
      } else {
        // For cash, bank, ung_hang, customer is required
        alert("Vui lòng chọn khách hàng!");
        return;
      }
    }

    // Use salePrice if available (adjusted price), otherwise use price
    const revenue = cart.reduce(
      (sum, item) => sum + (item.salePrice || item.price) * item.quantity,
      0,
    );
    const cost = cart.reduce(
      (sum, item) => sum + (item.cost || (item.salePrice || item.price) * 0.6) * item.quantity,
      0,
    );
    const profit = revenue - cost;
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Create order
    const order = onAddOrder({
      items: cart.map((item) => ({ ...item })),
      customer: customer.name,
      customerId: customer.id,
      paymentMethod,
      revenue,
      cost,
      profit,
      ...(paymentMethod === "ung_hang" && { ungHangPaid: false }),
    });

    if (!order) {
      alert("Không thể tạo đơn hàng! Vui lòng thử lại.");
      return;
    }

    // HYBRID LOGIC: If payment is Cash or Bank, create cashflow transaction
    // Ứng hàng: đơn đã tạo với ungHangPaid=false, trừ kho, tạo mục Chi (giá vốn).
    // Ứng hàng: Chi ghi nhận giá vốn (theo dõi hàng/tiền), KHÔNG trừ ví (chắc chắn trả tiền/hàng).
    if (paymentMethod === "ung_hang") {
      // Tạo giao dịch ứng hàng (không phải thu/chi, chỉ để theo dõi)
      try {
        if (onAddTransaction) {
          await onAddTransaction({
            date: toLocalDateStr(new Date()),
            type: "ung_hang",
            amount: revenue,
            cost: cost,
            wallet: "cash",
            category: "Ứng hàng chưa thu",
            note: `Ứng hàng - Khách ${customer.name} - ${cart.map((i) => `${i.name || "SP"} x${i.quantity}`).join(", ")} (chưa thu tiền)`,
            party: customer.name,
            linkedOrderId: order.id,
          });
        }
      } catch (err) {
        console.error("[OrdersModule] Lỗi khi tạo giao dịch ứng hàng:", err);
        alert("Đã tạo đơn ứng hàng nhưng không thể ghi vào Sổ Thu Chi. Vui lòng kiểm tra Sổ Thu Chi.");
      }
      const productsDetail = cart
        .map((i) => `${i.name || "SP"} x${i.quantity} = ${formatVND((i.salePrice || i.price) * i.quantity)}`)
        .join("\n");
      alert(
        `✅ Đơn ứng hàng đã ghi nhận thành công!\n\n` +
        `👤 Khách hàng: ${customer.name}\n\n` +
        `📦 Mặt hàng:\n${productsDetail}\n\n` +
        `💰 Tổng thành tiền: ${formatVND(revenue)}\n\n` +
        `💡 Khi khách trả tiền, vào "Sổ Thu Chi" → bấm "Thanh toán" ở ô màu đỏ.`,
      );
    } else if (paymentMethod === "cash" || paymentMethod === "bank") {
      const walletName = paymentMethod === "cash" ? "Tiền mặt" : "Ngân hàng";

      // Update wallet with amount received
      if (onUpdateWallets && wallets) {
        const newWallets = { ...wallets };
        newWallets[paymentMethod] = (newWallets[paymentMethod] || 0) + revenue;
        onUpdateWallets(newWallets);
      }

      // Determine category based on customer
      let category = "Bán hàng trực tiếp";
      if (customer.name === "Dũng" && paymentMethod === "cash") {
        category = "Bán sỉ tiền mặt";
      }

      // Create transaction (no auto-deduct from credit)
      if (onAddTransaction) {
        try {
          onAddTransaction({
            date: toLocalDateStr(new Date()),
            type: "income",
            amount: revenue,
            cost: cost, // Thêm giá vốn để tính lời chính xác
            wallet: paymentMethod,
            category: category,
            note: `Thu tiền đơn hàng #${order.id} - Khách ${customer.name}`,
            party: customer.name,
            linkedOrderId: order.id,
          });
        } catch (err) {
          console.error("[OrdersModule] Lỗi khi tạo transaction:", err);
        }
      }

      alert(`✅ Đơn hàng đã hoàn tất!\n💰 ${formatVND(revenue)} đã được cộng vào ${walletName}`);
    } else if (paymentMethod === "tiktok") {
      // TikTok platform - no wallet update (chưa rút về)
      alert(
        `✅ Đơn hàng đã được ghi nhận!\n⏳ Tiền chưa về quỹ (đang giữ trên TikTok)\n💡 Khi rút tiền về, thêm vào "Sổ Thu Chi" với category "Rút tiền TikTok"`,
      );
    } else if (paymentMethod === "shopee") {
      // Shopee platform - no wallet update (chưa rút về)
      alert(
        `✅ Đơn hàng đã được ghi nhận!\n⏳ Tiền chưa về quỹ (đang giữ trên Shopee)\n💡 Khi rút tiền về, thêm vào "Sổ Thu Chi" với category "Rút tiền Shopee"`,
      );
    } else if (paymentMethod === "ecommerce") {
      // Other e-commerce platform - no wallet update
      alert(
        "✅ Đơn hàng đã được ghi nhận!\n⏳ Tiền chưa về quỹ (đang giữ trên sàn TMĐT)",
      );
    } else {
      // Fallback for any unknown payment method
      alert(
        "✅ Đơn hàng đã được ghi nhận!\n⏳ Vui lòng kiểm tra trạng thái đơn hàng.",
      );
    }

    // Deduct product quantities from inventory
    // Aggregate by product id: same product in multiple cart lines (e.g. different prices) must sum sold qty, then ONE update per product
    const soldByProductId = new Map();
    for (const cartItem of cart) {
      const pid = cartItem.id;
      const qty = parseFloat(cartItem.quantity) || 0;
      soldByProductId.set(pid, (soldByProductId.get(pid) || 0) + qty);
    }

    const productUpdates = [];
    for (const [productId, totalSold] of soldByProductId) {
      const product = products.find((p) => p.id === productId);
      if (product && onUpdateProduct) {
        const currentQuantity = parseFloat(product.quantity) || 0;
        const newQuantity = Math.max(0, currentQuantity - totalSold);
        productUpdates.push({ id: product.id, quantity: newQuantity });
      }
    }

    if (productUpdates.length > 0 && onUpdateProduct) {
      await Promise.all(
        productUpdates.map((u) =>
          Promise.resolve(onUpdateProduct(u.id, { quantity: u.quantity }))
        )
      );
    }

    // Reset
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod("cash");
  };

  const calculateTotals = () => {
    // Use salePrice if available (adjusted price), otherwise use price
    const revenue = cart.reduce(
      (sum, item) => sum + (item.salePrice || item.price) * item.quantity,
      0,
    );
    const cost = cart.reduce(
      (sum, item) => sum + (item.cost || (item.salePrice || item.price) * 0.6) * item.quantity,
      0,
    );
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  };

  const totals = calculateTotals();
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };





  // Sort orders by date (newest first)
  const sortedOrders = [...(orders || [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.id || 0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.id || 0);
    return dateB - dateA;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-deepSlate-700 dark:border-deepSlate-700 bg-gradient-to-r from-deepSlate-800 to-white dark:from-deepSlate-800/20 dark:to-gray-800">
        <button
          onClick={() => setShowOrderHistory(false)}
          className={`flex-1 px-6 py-3 font-medium transition-colors ${
            !showOrderHistory
              ? "text-emerald-500 border-b-2 border-deepSlate-700 dark:text-emerald-400"
              : "text-emerald-500 dark:text-emerald-400 hover:text-deepSlate-50 dark:hover:text-deepSlate-200"
          }`}
        >
          Tạo đơn hàng
        </button>
        <button
          onClick={() => setShowOrderHistory(true)}
          className={`flex-1 px-6 py-3 font-medium transition-colors ${
            showOrderHistory
              ? "text-emerald-500 border-b-2 border-deepSlate-700 dark:text-emerald-400"
              : "text-emerald-500 dark:text-emerald-400 hover:text-deepSlate-50 dark:hover:text-deepSlate-200"
          }`}
        >
          Lịch sử đơn hàng ({orders?.length || 0})
        </button>
      </div>

      {showOrderHistory ? (
        /* Order History */
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900">
          <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100 mb-4">
            Lịch sử đơn hàng
          </h2>
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12 text-emerald-500 dark:text-emerald-400">
              Chưa có đơn hàng nào
            </div>
          ) : (
            <div className="space-y-4">
              {sortedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gradient-to-br from-deepSlate-800 to-deepSlate-700 dark:from-deepSlate-800 dark:to-deepSlate-700 rounded-lg p-4 border border-deepSlate-700 dark:border-deepSlate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-deepSlate-50 dark:text-deepSlate-100">
                          Đơn #{order.id}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.createdAt || order.date)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <p>
                          <strong>Khách hàng:</strong> {order.customer || "Khách lẻ"}
                        </p>
                        <p>
                          <strong>Hình thức:</strong>{" "}
                          {order.paymentMethod === "cash"
                            ? "💵 Tiền mặt"
                            : order.paymentMethod === "bank"
                            ? "🏦 Chuyển khoản"
                            : order.paymentMethod === "ung_hang"
                            ? `📦 Ứng hàng${order.ungHangPaid ? " (đã thu)" : " (chưa thu)"}`
                            : order.paymentMethod === "tiktok"
                            ? "📱 TikTok"
                            : order.paymentMethod === "shopee"
                            ? "🛒 Shopee"
                            : order.paymentMethod === "ecommerce"
                            ? "🛒 Sàn TMĐT"
                            : order.paymentMethod}
                        </p>
                      </div>
                      {order.items && Array.isArray(order.items) && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sản phẩm:
                          </p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                • {item.name} x{item.quantity} = {formatVND((item.salePrice || item.price) * item.quantity)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-3 flex gap-4 text-sm">
                        <span>
                          <strong>Doanh thu:</strong>{" "}
                          <span className="text-green-600 dark:text-green-400">
                            {formatVND(order.revenue || 0)}
                          </span>
                        </span>
                        <span>
                          <strong>Giá vốn:</strong>{" "}
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatVND(order.cost || 0)}
                          </span>
                        </span>
                        <span>
                          <strong>Lợi nhuận:</strong>{" "}
                          <span className="text-blue-600 dark:text-blue-400">
                            {formatVND(order.profit || 0)}
                          </span>
                        </span>
                      </div>
                    </div>
                    {onDeleteOrder && (
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="ml-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Xóa đơn hàng (sẽ trả lại số lượng vào kho)"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Create Order - overflow-y-auto so entire area can scroll to button if flex height fails */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto">
          {/* Left: Product List - on mobile flex-none so whole area scrolls; on lg flex-1 */}
          <div className="flex-none lg:flex-1 flex flex-col min-w-0 lg:border-r border-deepSlate-700 dark:border-deepSlate-700">
            <div className="p-3 sm:p-4 lg:p-6 flex-shrink-0 border-b border-deepSlate-700 dark:border-deepSlate-700 bg-deepSlate-800 dark:bg-deepSlate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                  Danh sách sản phẩm
                </h2>
                <div className="flex items-center gap-2">
                  {/* NÚT NHẬP/XUẤT EXCEL ĐÃ BỊ XÓA THEO YÊU CẦU NGƯỜI DÙNG */}
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap touch-manipulation min-h-[40px]"
                  >
                    <Plus size={18} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Thêm SP</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-4 lg:p-6 min-h-0">
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <Search
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-deepSlate-800 dark:bg-deepSlate-800 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Grid: mobile 1 cột (tên rõ), tablet 2–3 cột, desktop 4–5 cột */}
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => {
            const currentPrice = getProductPrice(product, selectedCustomer, paymentMethod);
            const cost = product.cost || product.price * 0.6;
            const profit = currentPrice - cost;
            return (
              <div
                key={product.id}
                className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-2.5 sm:p-3 border border-deepSlate-700 dark:border-deepSlate-700 hover:border-emerald-500 dark:hover:border-emerald-500 active:border-emerald-500 transition-all relative group flex flex-col min-h-0"
              >
                {/* Edit / Delete: hover (desktop), luôn hiện trên touch (md trở xuống) */}
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                  {onUpdateProduct && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                      className="p-1 sm:p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded touch-manipulation"
                      title="Sửa"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  {onDeleteProduct && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Xóa "${product.name || product.productName || 'sản phẩm'}"?`)) onDeleteProduct(product.id);
                      }}
                      className="p-1 sm:p-1.5 bg-red-500 hover:bg-red-600 text-white rounded touch-manipulation"
                      title="Xóa"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div
                  onClick={() => addToCart(product)}
                  className="flex flex-col min-h-0 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-start gap-1 min-h-0">
                    <h3 
                      className="text-sm sm:text-base font-semibold text-deepSlate-50 dark:text-deepSlate-100 flex-1 min-w-0 line-clamp-3 break-words leading-snug min-h-[3em] overflow-hidden" 
                      title={product.name || product.productName || ''}
                    >
                      {product.name || product.productName || 'Sản phẩm'}
                    </h3>
                    {product.quantity !== undefined && (
                      <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 px-1 sm:px-1.5 py-0.5 rounded shrink-0 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        Tồn {product.quantity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold mt-0.5 leading-tight">
                    {formatVND(currentPrice)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    Vốn {formatVND(cost)} · Lãi {formatVND(profit)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  className="mt-1.5 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 sm:py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 shrink-0 touch-manipulation min-h-[36px] sm:min-h-0"
                >
                  <Plus size={14} />
                  Thêm
                </button>
              </div>
            );
          })}
        </div>
            </div>
          </div>

          {/* Right: Cart - on mobile flex-none so column takes natural height and main area scrolls to button; on lg flex-none + fixed width */}
          <div className="w-full lg:w-[450px] flex-none flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-deepSlate-700 dark:border-deepSlate-700 bg-deepSlate-800 dark:bg-deepSlate-800 lg:flex-1 lg:min-h-0">
        <div className="p-4 lg:p-6 flex-shrink-0 border-b border-deepSlate-700 dark:border-deepSlate-700 bg-deepSlate-800 dark:bg-deepSlate-800">
          <h2 className="text-xl lg:text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100 flex items-center">
            <ShoppingCart size={24} className="mr-2" />
            Đơn hàng hiện tại
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 min-h-0">
          <div className="mb-4 flex-shrink-0">
          {/* Customer Selection - Hidden for TMDT platforms (tiktok, shopee, ecommerce) */}
          {!(paymentMethod === "tiktok" || paymentMethod === "shopee" || paymentMethod === "ecommerce") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User size={16} className="inline mr-1" />
              Khách hàng *
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCustomer?.name ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const customer = val ? (customers || []).find((c) => c?.name === val) ?? null : null;
                  setSelectedCustomer(customer);
                  if (customer?.defaultPriceType) {
                    const pm = customer.defaultPriceType === "wholesale" || customer.defaultPriceType === "credit" ? "cash" : customer.defaultPriceType;
                    setPaymentMethod(pm);
                  }
                }}
                className="flex-1 min-w-[200px] px-3 lg:px-4 py-2 text-sm lg:text-base border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-deepSlate-800 dark:bg-deepSlate-800 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Chọn khách --</option>
                {(customers || []).map((customer, idx) => (
                  <option key={customer?.id ?? idx} value={customer?.name ?? ""}>
                    {customer?.name ?? ""} {customer?.phone && `(${customer.phone})`} {customer?.bank && `- ${customer.bank}`}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex-shrink-0"
                  title="Thêm khách hàng mới"
                >
                  <Plus size={20} />
                </button>
                {selectedCustomer && selectedCustomer.name !== "Khách lẻ" && (
                  <>
                    {onUpdateCustomer && (
                      <button
                        onClick={() => {
                          setEditingCustomer(selectedCustomer);
                          setNewCustomer({
                            name: selectedCustomer.name || "",
                            phone: selectedCustomer.phone || "",
                            bank: selectedCustomer.bank || "",
                            accountNumber: selectedCustomer.accountNumber || "",
                            defaultPriceType: selectedCustomer.defaultPriceType || "cash",
                          });
                          setShowEditCustomerModal(true);
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-shrink-0"
                        title="Sửa thông tin khách hàng"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                    {onDeleteCustomer && (
                      <button
                        onClick={() => {
                          onDeleteCustomer(selectedCustomer.id);
                          setSelectedCustomer(null);
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex-shrink-0"
                        title="Xóa khách hàng này"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {selectedCustomer && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {selectedCustomer.phone && (
                  <p className="text-xs text-black dark:text-gray-400">
                    📞 {selectedCustomer.phone}
                  </p>
                )}
                {selectedCustomer.bank && (
                  <p className="text-xs text-black dark:text-gray-400">
                    🏦 {selectedCustomer.bank} {selectedCustomer.accountNumber && `- STK: ${selectedCustomer.accountNumber}`}
                  </p>
                )}
              </div>
            )}
            {!selectedCustomer && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mặc định: Khách lẻ
              </p>
            )}
          </div>
          )}

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-2">
              Hình thức thanh toán *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 text-base font-medium border-2 border-blue-500 dark:border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
            >
              <option value="cash">💵 Tiền mặt (cộng vào quỹ ngay)</option>
              <option value="bank">🏦 Chuyển khoản (cộng vào quỹ ngay)</option>
              <option value="ung_hang">📦 Ứng hàng (chưa thu tiền)</option>
              <option value="tiktok">📱 TikTok (chưa về quỹ)</option>
              <option value="shopee">🛒 Shopee (chưa về quỹ)</option>
              <option value="ecommerce">🛒 Sàn TMĐT khác (chưa về quỹ)</option>
            </select>
            {(paymentMethod === "tiktok" || paymentMethod === "shopee" || paymentMethod === "ecommerce") && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Lưu ý: Sàn TMĐT không cần chọn khách hàng. Đơn hàng sẽ được ghi nhận tự động.
              </p>
            )}
          </div>


          {/* Info Banner */}
          <div
            className={`border rounded-lg p-3 mb-4 ${
              paymentMethod === "ung_hang"
                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                : paymentMethod === "tiktok" || paymentMethod === "shopee" || paymentMethod === "ecommerce"
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            <p
              className={`text-xs ${
                paymentMethod === "ung_hang"
                  ? "text-orange-800 dark:text-orange-400"
                  : paymentMethod === "tiktok" || paymentMethod === "shopee" || paymentMethod === "ecommerce"
                  ? "text-yellow-800 dark:text-yellow-400"
                  : "text-green-800 dark:text-green-400"
              }`}
            >
              {paymentMethod === "ung_hang" ? (
                <>
                  📦 Ứng hàng: Số lượng trừ kho ngay. Tiền chưa thu. Khi khách trả, vào "Sổ Thu Chi" → bấm "Thanh toán" ở ô màu đỏ.
                </>
              ) : paymentMethod === "tiktok" ? (
                <>
                  ⏳ TikTok: Đơn được lưu nhưng KHÔNG cộng vào quỹ (tiền giữ trên TikTok).
                  Khi rút về, thêm vào "Sổ Thu Chi" với category "Rút tiền TikTok"
                </>
              ) : paymentMethod === "shopee" ? (
                <>
                  ⏳ Shopee: Đơn được lưu nhưng KHÔNG cộng vào quỹ (tiền giữ trên Shopee).
                  Khi rút về, thêm vào "Sổ Thu Chi" với category "Rút tiền Shopee"
                </>
              ) : paymentMethod === "ecommerce" ? (
                <>
                  ⏳ Sàn TMĐT: Đơn được lưu nhưng KHÔNG cộng vào quỹ (tiền giữ trên sàn)
                </>
              ) : (
                <>
                  ✅ {paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}:
                  Tự động cộng vào quỹ + ghi sổ thu chi
                </>
              )}
            </p>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 mb-4 space-y-4 min-h-0">
          {cart.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-base">
              Chưa có sản phẩm trong đơn hàng
            </p>
          ) : (
            cart.map((item) => {
              const salePrice = item.salePrice || item.price;
              const totalPrice = salePrice * item.quantity;
              
              return (
                <div
                  key={`${item.id}-${salePrice}`}
                  className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-5 border border-deepSlate-700 dark:border-deepSlate-700 mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-deepSlate-50 dark:text-deepSlate-100">
                        {item.name}
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vốn: {formatVND(item.cost || salePrice * 0.6)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, salePrice)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                  
                  {/* Price adjustment with dropdown */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Giá bán:
                    </label>
                    <select
                      value={salePrice}
                      onChange={(e) => {
                        const selectedPrice = parseFloat(e.target.value);
                        if (!isNaN(selectedPrice) && selectedPrice > 0) {
                          updateCartItemPrice(item.id, selectedPrice, salePrice);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm lg:text-base border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-deepSlate-800 dark:bg-deepSlate-800 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      {item.price && (
                        <option value={item.price}>
                          Bán lẻ: {formatVND(item.price)}
                        </option>
                      )}
                      {item.wholesalePrice && (
                        <option value={item.wholesalePrice}>
                          Bán sỉ: {formatVND(item.wholesalePrice)}
                        </option>
                      )}
                      {item.tiktokPrice && (
                        <option value={item.tiktokPrice}>
                          TikTok: {formatVND(item.tiktokPrice)}
                        </option>
                      )}
                      {item.shopeePrice && (
                        <option value={item.shopeePrice}>
                          Shopee: {formatVND(item.shopeePrice)}
                        </option>
                      )}
                      {/* Custom price option - show current price if not in list */}
                      {salePrice !== item.price && 
                       salePrice !== item.wholesalePrice && 
                       salePrice !== item.tiktokPrice && 
                       salePrice !== item.shopeePrice && (
                        <option value={salePrice}>
                          Tùy chỉnh: {formatVND(salePrice)}
                        </option>
                      )}
                    </select>
                    {/* Input for custom price if needed */}
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => updateCartItemPrice(item.id, e.target.value, salePrice)}
                      placeholder="Hoặc nhập giá tùy chỉnh"
                      className="w-full mt-2 px-3 py-2 text-sm border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-deepSlate-800 dark:bg-deepSlate-800 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                    {item.originalPrice && item.originalPrice !== salePrice && (
                      <p className="text-xs lg:text-sm text-gray-400 mt-2">
                        Giá gốc: {formatVND(item.originalPrice)}
                      </p>
                    )}
                  </div>
                  
                  {/* Quantity */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, salePrice)}
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-lg font-semibold text-gray-700 dark:text-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          if (newQuantity > 0) {
                            updateQuantity(item.id, newQuantity, salePrice);
                          }
                        }}
                        className="w-20 text-center text-lg text-deepSlate-50 dark:text-deepSlate-100 font-semibold border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-deepSlate-800 dark:bg-deepSlate-800 px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, salePrice)}
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-lg font-semibold text-gray-700 dark:text-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-right font-bold text-lg text-blue-600 dark:text-blue-400">
                      {formatVND(totalPrice)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <>
            <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-4 border border-deepSlate-700 dark:border-deepSlate-700 space-y-3 mb-4 flex-shrink-0">
              <h3 className="font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-3">
                Tóm tắt đơn hàng
              </h3>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Doanh thu:</span>
                <span className="font-semibold">
                  {formatVND(totals.revenue)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Giá vốn:</span>
                <span className="font-semibold">{formatVND(totals.cost)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Lãi gộp:
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

            {/* Action Buttons - Sticky on mobile */}
            <div className="space-y-2 flex-shrink-0 pt-4 border-t border-deepSlate-700 dark:border-deepSlate-700 mt-4">
              <button
                onClick={handleCompleteOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg"
              >
                <ShoppingCart size={20} className="mr-2" />
                Hoàn tất Đơn hàng
              </button>
            </div>
          </>
        )}
        </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm sản phẩm mới
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đậu 200g"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vốn *
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 15000"
                    value={newProduct.cost}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, cost: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Số lượng trong kho
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 100"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantity: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Giá bán (có thể để trống, sẽ tự động tính = 2x vốn):
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bán lẻ
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 29000"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bán sỉ (tiền mặt)
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 17500"
                      value={newProduct.wholesalePrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, wholesalePrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      TikTok nhận về
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 16000"
                      value={newProduct.tiktokPrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, tiktokPrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shopee nhận về
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 15500"
                      value={newProduct.shopeePrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, shopeePrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Chỉnh sửa sản phẩm
              </h3>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                  setNewProduct({ 
                    name: "", 
                    cost: "", 
                    price: "", 
                    wholesalePrice: "", 
                    tiktokPrice: "", 
                    shopeePrice: "", 
                    quantity: "" 
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đậu 200g"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vốn *
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 15000"
                    value={newProduct.cost}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, cost: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Số lượng trong kho
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 100"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantity: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Giá bán (có thể để trống, sẽ tự động tính = 2x vốn):
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bán lẻ
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 29000"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bán sỉ (tiền mặt)
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 17500"
                      value={newProduct.wholesalePrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, wholesalePrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      TikTok nhận về
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 16000"
                      value={newProduct.tiktokPrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, tiktokPrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shopee nhận về
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 15500"
                      value={newProduct.shopeePrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, shopeePrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                  setNewProduct({ 
                    name: "", 
                    cost: "", 
                    price: "", 
                    wholesalePrice: "", 
                    tiktokPrice: "", 
                    shopeePrice: "", 
                    quantity: "" 
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateProduct}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm khách hàng mới
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên khách hàng *"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <input
                type="tel"
                placeholder="Số điện thoại (tùy chọn)"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngân hàng (tùy chọn)
                </label>
                <div className="flex gap-2">
                  <select
                    value={newCustomer.bank}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, bank: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                    <option value="__other__">+ Thêm ngân hàng mới</option>
                  </select>
                  {newCustomer.bank === "__other__" && (
                    <input
                      type="text"
                      placeholder="Tên ngân hàng"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      onBlur={() => {
                        if (newBankName.trim()) {
                          if (!banks.includes(newBankName.trim())) {
                            setBanks([...banks, newBankName.trim()]);
                          }
                          setNewCustomer({ ...newCustomer, bank: newBankName.trim() });
                          setNewBankName("");
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  )}
                </div>
              </div>
              {newCustomer.bank && newCustomer.bank !== "__other__" && (
                <input
                  type="text"
                  placeholder="Số tài khoản (tùy chọn)"
                  value={newCustomer.accountNumber}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, accountNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại giá mặc định *
                </label>
                <select
                  value={newCustomer.defaultPriceType || "cash"}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, defaultPriceType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">💵 Tiền mặt (giá bán lẻ)</option>
                  <option value="bank">🏦 Chuyển khoản (giá bán lẻ)</option>
                  <option value="wholesale">💰 Giá bán sỉ (tiền mặt)</option>
                  <option value="tiktok">📱 TikTok</option>
                  <option value="shopee">🛒 Shopee</option>
                  <option value="ecommerce">🛒 Sàn TMĐT khác</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Loại giá này sẽ tự động được chọn khi bạn chọn khách hàng này
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Sửa thông tin khách hàng
              </h3>
              <button
                onClick={() => {
                  setShowEditCustomerModal(false);
                  setEditingCustomer(null);
                  setNewCustomer({ name: "", phone: "", bank: "", accountNumber: "", defaultPriceType: "cash" });
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên khách hàng *"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <input
                type="tel"
                placeholder="Số điện thoại (tùy chọn)"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngân hàng (tùy chọn)
                </label>
                <div className="flex gap-2">
                  <select
                    value={newCustomer.bank}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, bank: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                    <option value="__other__">+ Thêm ngân hàng mới</option>
                  </select>
                  {newCustomer.bank === "__other__" && (
                    <input
                      type="text"
                      placeholder="Tên ngân hàng"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      onBlur={() => {
                        if (newBankName.trim()) {
                          if (!banks.includes(newBankName.trim())) {
                            setBanks([...banks, newBankName.trim()]);
                          }
                          setNewCustomer({ ...newCustomer, bank: newBankName.trim() });
                          setNewBankName("");
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  )}
                </div>
              </div>
              {newCustomer.bank && newCustomer.bank !== "__other__" && (
                <input
                  type="text"
                  placeholder="Số tài khoản (tùy chọn)"
                  value={newCustomer.accountNumber}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, accountNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại giá mặc định *
                </label>
                <select
                  value={newCustomer.defaultPriceType || "cash"}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, defaultPriceType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">💵 Tiền mặt (giá bán lẻ)</option>
                  <option value="bank">🏦 Chuyển khoản (giá bán lẻ)</option>
                  <option value="wholesale">💰 Giá bán sỉ (tiền mặt)</option>
                  <option value="tiktok">📱 TikTok</option>
                  <option value="shopee">🛒 Shopee</option>
                  <option value="ecommerce">🛒 Sàn TMĐT khác</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Loại giá này sẽ tự động được chọn khi bạn chọn khách hàng này
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditCustomerModal(false);
                  setEditingCustomer(null);
                  setNewCustomer({ name: "", phone: "", bank: "", accountNumber: "", defaultPriceType: "cash" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

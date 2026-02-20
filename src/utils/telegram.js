/**
 * Telegram Bot API Utilities
 * Gửi thông báo qua server-side proxy để bảo vệ bot token
 */

const API_BASE = '/api/telegram/notify';

// Helper để xử lý ký tự đặc biệt trong HTML Telegram
const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Gửi tin nhắn text đến Telegram (qua server proxy)
 */
export async function sendMessage(message) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (!data.ok) console.error('[Telegram] Lỗi API:', data);
    return data;
  } catch (error) {
    console.error('[Telegram] Lỗi kết nối:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Gửi thông báo đơn hàng mới
 */
export async function sendOrderNotification(order) {
  const items = order.items
    .map((item) => `  • ${escapeHTML(item.name || item.productName)} x${item.quantity}`)
    .join('\n');

  const message = `
🛒 <b>ĐƠN HÀNG MỚI #${order.id}</b>

👤 Khách hàng: <b>${escapeHTML(order.customer || 'Khách lẻ')}</b>
💰 Tổng tiền: <code>${formatVND(order.revenue)}</code>
💎 Lợi nhuận: <code>${formatVND(order.profit)}</code>

📦 Sản phẩm:
${items}

💳 Thanh toán: ${getPaymentMethodName(order.paymentMethod)}
📅 Thời gian: ${new Date().toLocaleString('vi-VN')}
  `.trim();

  return sendMessage(message);
}

/**
 * Gửi thông báo thanh toán ứng hàng
 */
export async function sendPaymentNotification(customerName, amount, cost) {
  const profit = amount - cost;
  const message = `
💰 <b>THANH TOÁN ỨNG HÀNG</b>

👤 Khách hàng: <b>${escapeHTML(customerName)}</b>
💵 Số tiền thu: <code>${formatVND(amount)}</code>
💎 Lợi nhuận: <code>${formatVND(profit)}</code>

📅 Thời gian: ${new Date().toLocaleString('vi-VN')}
  `.trim();

  return sendMessage(message);
}

/**
 * Gửi thông báo hàng tồn kho thấp
 */
export async function sendLowStockAlert(lowStockProducts) {
  if (!lowStockProducts?.length) return { ok: false };

  const items = lowStockProducts
    .map((p) => `  • ${escapeHTML(p.name)}: còn <b>${p.quantity}</b> sản phẩm`)
    .join('\n');

  const message = `
⚠️ <b>CẢNH BÁO TỒN KHO THẤP</b>

Các sản phẩm sau sắp hết hàng:
${items}

💡 Vui lòng nhập thêm hàng!
  `.trim();

  return sendMessage(message);
}

// Helper functions
function formatVND(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

function getPaymentMethodName(method) {
  const names = {
    cash: '💵 Tiền mặt',
    bank: '🏦 Chuyển khoản',
    ung_hang: '📋 Ứng hàng',
    tiktok: '📱 TikTok',
    shopee: '🛍️ Shopee',
    ecommerce: '🌐 TMĐT',
  };
  return names[method] || method;
}
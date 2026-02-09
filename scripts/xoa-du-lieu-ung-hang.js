/**
 * Script xóa dữ liệu Ứng hàng (needsPayment) khỏi localStorage
 * Chạy trong Console trình duyệt (F12) khi đang mở app
 * 
 * Cách dùng: Copy toàn bộ file này, paste vào Console, Enter
 */

(function removeUngHangData() {
  if (typeof localStorage === 'undefined') {
    console.error('Chỉ chạy được trong trình duyệt (localStorage không tồn tại)');
    return;
  }

  const keysToClean = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k === 'finmaster_transactions' || k.includes('finmaster_transactions_user_') || k.includes('finmaster_transactions_sync_user_')) {
      keysToClean.push(k);
    }
    if (k === 'finmaster_reset_template' || k.includes('finmaster_reset_template_user_')) {
      keysToClean.push(k);
    }
  }

  let totalRemoved = 0;

  keysToClean.forEach(key => {
    if (key.includes('_sync_')) {
      localStorage.removeItem(key);
      console.log('Đã xóa sync key:', key);
      totalRemoved++;
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const filtered = data.filter(t => !(t.needsPayment === true || t.status === 'pending'));
        if (filtered.length !== data.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          const removed = data.length - filtered.length;
          totalRemoved += removed;
          console.log('Đã xóa', removed, 'giao dịch Ứng hàng từ', key);
        }
      } else if (data && Array.isArray(data.transactions)) {
        const filtered = data.transactions.filter(t => !(t.needsPayment === true || t.status === 'pending'));
        const removed = data.transactions.length - filtered.length;
        if (removed > 0) {
          data.transactions = filtered;
          localStorage.setItem(key, JSON.stringify(data));
          totalRemoved += removed;
          console.log('Đã xóa', removed, 'giao dịch Ứng hàng từ reset_template', key);
        }
      }
    } catch (e) {
      console.warn('Lỗi xử lý', key, e);
    }
  });

  if (totalRemoved > 0) {
    console.log('✅ Đã xóa sạch dữ liệu Ứng hàng. Nhấn F5 để tải lại trang.');
  } else {
    console.log('Không tìm thấy dữ liệu Ứng hàng cần xóa.');
  }
})();

/**
 * Script xóa TOÀN BỘ dữ liệu đã lưu - chỉ giữ lại logic app.
 * Chạy trong Console trình duyệt (F12) khi đang mở trang app.
 *
 * Các key được xóa (đã kiểm tra toàn bộ codebase):
 * localStorage: finmaster_*, auth_token, auth_user
 * sessionStorage: finmaster_*
 *
 * Cách dùng:
 * 1. Mở trang app trong trình duyệt
 * 2. Nhấn F12 → tab Console
 * 3. Copy toàn bộ nội dung file này, dán vào Console, Enter
 * 4. Nhấn F5 để tải lại trang
 */

(function clearAllFinmasterData() {
  // true = xóa cả đăng nhập | false = giữ đăng nhập, chỉ xóa dữ liệu app
  const clearAuth = true;

  let removed = 0;

  // 1. localStorage: xóa tất cả key bắt đầu bằng finmaster_
  // Bao gồm: wallets, transactions, orders, products, categories, templates,
  // customers, debts, initialized, reset_template, target_earnings, target_days,
  // last_sync_user_*, *_sync_user_* (dataSync)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith("finmaster_")) {
      localStorage.removeItem(key);
      removed++;
      console.log("Đã xóa:", key);
    }
  }

  // 2. localStorage: xóa auth (nếu chọn)
  if (clearAuth) {
    if (localStorage.getItem("auth_token")) {
      localStorage.removeItem("auth_token");
      removed++;
      console.log("Đã xóa: auth_token");
    }
    if (localStorage.getItem("auth_user")) {
      localStorage.removeItem("auth_user");
      removed++;
      console.log("Đã xóa: auth_user");
    }
  }

  // 3. sessionStorage: xóa tất cả key bắt đầu bằng finmaster_
  // Bao gồm: finmaster_full_reset_ts
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("finmaster_")) {
      sessionStorage.removeItem(key);
      removed++;
      console.log("Đã xóa (sessionStorage):", key);
    }
  }

  console.log("✅ Đã xóa toàn bộ dữ liệu (" + removed + " key). Nhấn F5 để tải lại trang.");
})();

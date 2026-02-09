/**
 * Script làm sạch sản phẩm trùng lặp (duplicate products)
 * Chạy trong Console trình duyệt (F12) khi đang mở app
 * 
 * Cách dùng: 
 * 1. Mở app trong trình duyệt
 * 2. Nhấn F12 → tab Console
 * 3. Copy toàn bộ file này, paste vào Console, Enter
 * 4. Nhấn F5 để tải lại trang
 * 
 * LƯU Ý: Nếu Chrome/Edge yêu cầu, gõ "allow pasting" trước khi paste
 */

(function fixDuplicateProducts() {
  console.log('========================================');
  console.log('🚀 SCRIPT FIX DUPLICATE PRODUCTS BẮT ĐẦU');
  console.log('========================================');
  
  if (typeof localStorage === 'undefined') {
    console.error('❌ Chỉ chạy được trong trình duyệt (localStorage không tồn tại)');
    return;
  }

  console.log('✅ localStorage đã sẵn sàng');
  console.log('🔍 Bắt đầu kiểm tra sản phẩm trùng lặp...');

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user?.id ?? user?.userId ?? null;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  };

  // Get storage key with user ID
  const getStorageKey = (baseKey) => {
    const userId = getCurrentUserId();
    if (userId) {
      return `${baseKey}_user_${userId}`;
    }
    return baseKey;
  };

  const PRODUCTS_KEY = 'finmaster_products';
  const storageKey = getStorageKey(PRODUCTS_KEY);
  
  console.log('📌 Storage key đang dùng:', storageKey);
  
  // Get products
  const rawData = localStorage.getItem(storageKey);
  if (!rawData) {
    console.log('ℹ️ Không tìm thấy dữ liệu sản phẩm');
    console.log('💡 Kiểm tra tất cả keys trong localStorage:');
    const allKeys = Object.keys(localStorage);
    console.log('  Tổng số keys:', allKeys.length);
    const productKeys = allKeys.filter(k => k.includes('product'));
    if (productKeys.length > 0) {
      console.log('  Keys liên quan đến product:', productKeys);
    } else {
      console.log('  Không có key nào chứa "product"');
      console.log('  Tất cả keys:', allKeys);
    }
    return;
  }

  let products = [];
  try {
    products = JSON.parse(rawData);
    if (!Array.isArray(products)) {
      console.error('❌ Dữ liệu sản phẩm không phải mảng');
      return;
    }
  } catch (e) {
    console.error('❌ Lỗi parse JSON:', e);
    return;
  }

  const originalCount = products.length;
  console.log(`📊 Tổng số sản phẩm hiện tại: ${originalCount}`);

  // Phân tích duplicate
  const idCount = new Map();
  const nameCount = new Map();
  
  products.forEach(p => {
    if (p.id) {
      idCount.set(p.id, (idCount.get(p.id) || 0) + 1);
    }
    if (p.name) {
      nameCount.set(p.name, (nameCount.get(p.name) || 0) + 1);
    }
  });

  // Thống kê
  const duplicateIds = Array.from(idCount.entries()).filter(([id, count]) => count > 1);
  const duplicateNames = Array.from(nameCount.entries()).filter(([name, count]) => count > 1);

  console.log('\n📈 Phân tích:');
  console.log(`  - Sản phẩm trùng ID: ${duplicateIds.length} ID bị trùng`);
  if (duplicateIds.length > 0) {
    console.log('  Top 5 ID trùng nhiều nhất:');
    duplicateIds.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([id, count]) => {
      const product = products.find(p => p.id === id);
      console.log(`    ID ${id}: ${count} lần - "${product?.name || 'N/A'}"`);
    });
  }

  console.log(`  - Sản phẩm trùng tên: ${duplicateNames.length} tên bị trùng`);
  if (duplicateNames.length > 0) {
    console.log('  Top 5 tên trùng nhiều nhất:');
    duplicateNames.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, count]) => {
      console.log(`    "${name}": ${count} lần`);
    });
  }

  // Loại bỏ duplicate theo ID - GIỮ sản phẩm có quantity > 0 hoặc createdAt mới nhất
  const seenIds = new Set();
  const uniqueProducts = [];
  const removedProducts = [];

  // Sắp xếp: ưu tiên quantity > 0, sau đó theo updatedAt/createdAt mới nhất
  const sorted = [...products].sort((a, b) => {
    // Ưu tiên sản phẩm có quantity > 0
    const aHasStock = (a.quantity || 0) > 0;
    const bHasStock = (b.quantity || 0) > 0;
    if (aHasStock !== bHasStock) return bHasStock ? 1 : -1;
    
    // Nếu cả 2 đều có hoặc không có stock, ưu tiên updatedAt mới hơn
    const aTime = a.updatedAt || a.createdAt || 0;
    const bTime = b.updatedAt || b.createdAt || 0;
    return bTime - aTime;
  });

  sorted.forEach(p => {
    if (!p.id) {
      console.warn('⚠️ Sản phẩm không có ID, bỏ qua:', p);
      removedProducts.push(p);
      return;
    }

    if (seenIds.has(p.id)) {
      removedProducts.push(p);
      return;
    }

    seenIds.add(p.id);
    uniqueProducts.push(p);
  });

  const removedCount = originalCount - uniqueProducts.length;

  console.log(`\n✅ Kết quả:`);
  console.log(`  - Sản phẩm ban đầu: ${originalCount}`);
  console.log(`  - Sản phẩm sau khi làm sạch: ${uniqueProducts.length}`);
  console.log(`  - Đã loại bỏ: ${removedCount} sản phẩm trùng lặp`);

  if (removedCount > 0) {
    // Hiển thị một số sản phẩm bị xóa
    console.log('\n🗑️ Một số sản phẩm đã loại bỏ (top 10):');
    removedProducts.slice(0, 10).forEach(p => {
      console.log(`  - ID ${p.id}: "${p.name}" (Tồn: ${p.quantity || 0})`);
    });

    // Lưu lại
    try {
      localStorage.setItem(storageKey, JSON.stringify(uniqueProducts));
      console.log('\n💾 Đã lưu dữ liệu đã làm sạch vào localStorage');
      console.log('🔄 Nhấn F5 để tải lại trang và thấy kết quả');
    } catch (e) {
      console.error('❌ Lỗi khi lưu dữ liệu:', e);
    }
  } else {
    console.log('\n✨ Không có sản phẩm trùng lặp, dữ liệu đã sạch!');
  }

  // Thống kê sau khi làm sạch
  console.log('\n📊 Thống kê sau khi làm sạch:');
  const productsByName = new Map();
  uniqueProducts.forEach(p => {
    if (!productsByName.has(p.name)) {
      productsByName.set(p.name, []);
    }
    productsByName.get(p.name).push(p);
  });

  const multipleByName = Array.from(productsByName.entries()).filter(([name, prods]) => prods.length > 1);
  if (multipleByName.length > 0) {
    console.log(`  - ${multipleByName.length} tên sản phẩm có nhiều biến thể (variants):`);
    multipleByName.slice(0, 5).forEach(([name, prods]) => {
      console.log(`    "${name}": ${prods.length} variants`);
      prods.forEach(p => {
        console.log(`      - ID ${p.id}, Giá: ${p.price}, Tồn: ${p.quantity || 0}`);
      });
    });
  }

  console.log('\n========================================');
  console.log('✅ SCRIPT HOÀN THÀNH');
  console.log('========================================');
  
  return {
    original: originalCount,
    unique: uniqueProducts.length,
    removed: removedCount,
    products: uniqueProducts
  };
})();

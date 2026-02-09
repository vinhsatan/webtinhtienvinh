/**
 * Script làm sạch sản phẩm trùng lặp THEO TÊN (không chỉ ID)
 * Xóa sản phẩm có tên giống nhau (bỏ qua hoa/thường và khoảng trắng)
 * 
 * Cách dùng: 
 * 1. Mở app trong trình duyệt
 * 2. Nhấn F12 → tab Console
 * 3. Gõ "allow pasting" → Enter (nếu cần)
 * 4. Copy toàn bộ file này, paste vào Console, Enter
 * 5. Nhấn F5 để tải lại trang
 */

(function fixDuplicateProductsByName() {
  console.log('========================================');
  console.log('🚀 SCRIPT FIX DUPLICATE BY NAME BẮT ĐẦU');
  console.log('========================================');
  
  if (typeof localStorage === 'undefined') {
    console.error('❌ Chỉ chạy được trong trình duyệt');
    return;
  }

  console.log('✅ localStorage đã sẵn sàng');

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
  
  console.log('📌 Storage key:', storageKey);
  
  // Get products
  const rawData = localStorage.getItem(storageKey);
  if (!rawData) {
    console.log('ℹ️ Không tìm thấy dữ liệu sản phẩm');
    return;
  }

  let products = [];
  try {
    products = JSON.parse(rawData);
    if (!Array.isArray(products)) {
      console.error('❌ Dữ liệu không phải mảng');
      return;
    }
  } catch (e) {
    console.error('❌ Lỗi parse JSON:', e);
    return;
  }

  const originalCount = products.length;
  console.log(`📊 Tổng số sản phẩm: ${originalCount}`);

  // Normalize tên sản phẩm để so sánh
  const normalizeName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Bỏ khoảng trắng thừa
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd');
  };

  // Tạo key để phát hiện duplicate: tên chuẩn hóa + giá
  const createDuplicateKey = (product) => {
    const normalizedName = normalizeName(product.name);
    const price = product.price || 0;
    return `${normalizedName}_${price}`;
  };

  // Phân nhóm sản phẩm theo duplicate key
  const productGroups = new Map();
  
  products.forEach(p => {
    if (!p.name) {
      console.warn('⚠️ Sản phẩm không có tên:', p);
      return;
    }
    
    const key = createDuplicateKey(p);
    if (!productGroups.has(key)) {
      productGroups.set(key, []);
    }
    productGroups.get(key).push(p);
  });

  console.log(`\n📈 Phân tích:`);
  const duplicateGroups = Array.from(productGroups.entries()).filter(([key, prods]) => prods.length > 1);
  console.log(`  - Nhóm sản phẩm trùng tên+giá: ${duplicateGroups.length}`);
  
  if (duplicateGroups.length > 0) {
    console.log('\n  Chi tiết các nhóm trùng (top 10):');
    duplicateGroups.slice(0, 10).forEach(([key, prods]) => {
      console.log(`  - "${prods[0].name}" (${prods[0].price}đ): ${prods.length} sản phẩm trùng`);
      prods.forEach(p => {
        console.log(`      ID: ${p.id}, Tồn: ${p.quantity || 0}, Created: ${new Date(p.createdAt || 0).toLocaleString()}`);
      });
    });
  }

  // Loại bỏ duplicate - GIỮ sản phẩm tốt nhất trong mỗi nhóm
  const uniqueProducts = [];
  const removedProducts = [];

  productGroups.forEach((prods, key) => {
    if (prods.length === 1) {
      // Không trùng, giữ nguyên
      uniqueProducts.push(prods[0]);
      return;
    }

    // Có trùng - sắp xếp và giữ sản phẩm tốt nhất
    const sorted = [...prods].sort((a, b) => {
      // Ưu tiên có quantity > 0
      const aHasStock = (a.quantity || 0) > 0;
      const bHasStock = (b.quantity || 0) > 0;
      if (aHasStock !== bHasStock) return bHasStock ? 1 : -1;
      
      // Ưu tiên có ID (sản phẩm đã lưu vào DB)
      const aHasId = !!a.id;
      const bHasId = !!b.id;
      if (aHasId !== bHasId) return bHasId ? 1 : -1;
      
      // Ưu tiên mới nhất
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      return bTime - aTime;
    });

    // Giữ sản phẩm đầu tiên (tốt nhất), xóa các sản phẩm còn lại
    uniqueProducts.push(sorted[0]);
    removedProducts.push(...sorted.slice(1));
  });

  const removedCount = removedProducts.length;

  console.log(`\n✅ Kết quả:`);
  console.log(`  - Sản phẩm ban đầu: ${originalCount}`);
  console.log(`  - Sản phẩm sau khi làm sạch: ${uniqueProducts.length}`);
  console.log(`  - Đã loại bỏ: ${removedCount} sản phẩm trùng lặp`);

  if (removedCount > 0) {
    console.log('\n🗑️ Các sản phẩm đã loại bỏ (top 20):');
    removedProducts.slice(0, 20).forEach(p => {
      console.log(`  - "${p.name}" (ID: ${p.id || 'N/A'}, Giá: ${p.price}đ, Tồn: ${p.quantity || 0})`);
    });

    // Lưu lại
    try {
      localStorage.setItem(storageKey, JSON.stringify(uniqueProducts));
      console.log('\n💾 Đã lưu dữ liệu đã làm sạch vào localStorage');
      console.log('🔄 NHẤN F5 ĐỂ TẢI LẠI TRANG');
      
      // Alert để người dùng biết
      alert(`✅ Đã xóa ${removedCount} sản phẩm trùng lặp!\n\nNhấn OK rồi nhấn F5 để tải lại trang.`);
    } catch (e) {
      console.error('❌ Lỗi khi lưu:', e);
    }
  } else {
    console.log('\n✨ Không có sản phẩm trùng lặp!');
  }

  console.log('\n========================================');
  console.log('✅ HOÀN THÀNH');
  console.log('========================================');
  
  return {
    original: originalCount,
    unique: uniqueProducts.length,
    removed: removedCount,
    removedProducts: removedProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: p.quantity
    }))
  };
})();

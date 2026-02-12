// 5 Color Themes - Chỉ thay đổi màu sắc, KHÔNG thay logic
export const colorSchemes = {
  // 1. "Hồng Phấn Nàng Thơ" - Nhẹ nhàng, dịu dàng
  muse_pink: {
    id: 'muse_pink',
    name: 'Chạm vào sự dịu dàng',
    description: 'Hồng Phấn Nàng Thơ',
    color: '#FFB7C5',
    bg_primary: '#FFF5F7',      // Hồng trắng - cực nhạt
    bg_secondary: '#FFFFFF',    // Trắng tinh khôi
    accent: '#FFB7C5',          // Hồng hoa anh đào
    accent_dark: '#FFB7C5',
    text_primary: '#6D5D6E',    // Xám tím
    text_secondary: '#8B7A8B',
    card_bg: '#FFFFFF',
    card_border: '#FFCCDD',
    success: '#FFB7C5',
    warning: '#FFB7C5',
    error: '#FF9AB5',
    gradient: 'linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)',
    isDark: false,
  },

  // 2. "Cánh Sen Quyền Lực" - Neon, mạnh mẽ
  empress_fuchsia: {
    id: 'empress_fuchsia',
    name: 'Bùng nổ doanh số',
    description: 'Cánh Sen Quyền Lực',
    color: '#FF007F',
    bg_primary: '#1A1A1D',      // Đen than đá
    bg_secondary: '#2D2D31',    // Xám đen
    accent: '#FF007F',          // Hồng cánh sen đậm
    accent_dark: '#FF007F',
    text_primary: '#FFFFFF',    // Trắng sáng
    text_secondary: '#E0E0E0',
    card_bg: '#2D2D31',
    card_border: '#FF007F',
    success: '#FF007F',
    warning: '#950740',         // Hồng rượu vang
    error: '#FF0066',
    gradient: 'linear-gradient(135deg, #1A1A1D 0%, #2D2D31 100%)',
    isDark: true,
    hasGlow: true,
  },

  // 3. "Mật Đào Ngọt Ngào" - Gradient, dễ thương
  sweetie_peach: {
    id: 'sweetie_peach',
    name: 'Năng lượng tích cực',
    description: 'Mật Đào Ngọt Ngào',
    color: '#FF7A5C',
    bg_primary: '#FEF1E6',      // Màu kem đào
    bg_secondary: '#FFFFFF',    // Trắng
    accent: '#FF6B6B',          // Hồng cam san hô
    accent_dark: '#FF5252',
    text_primary: '#4A4A4A',    // Xám đậm
    text_secondary: '#6B6B6B',
    card_bg: 'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)',
    card_border: '#FF6B6B',
    success: '#FF6B6B',
    warning: '#FFA07A',         // Cam nhạt
    error: '#FF5252',
    gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)',
    isDark: false,
  },

  // 4. "Quý Cô Thượng Lưu" - Sang trọng, gold
  velvet_rose: {
    id: 'velvet_rose',
    name: 'Đẳng cấp nữ hoàng',
    description: 'Quý Cô Thượng Lưu',
    color: '#C08261',
    bg_primary: '#F3E8E8',      // Hồng tro nhạt
    bg_secondary: '#FFFFFF',    // Trắng
    accent: '#C08261',          // Vàng đồng/Rose Gold
    accent_dark: '#A0674A',
    text_primary: '#522258',    // Hồng tím sẫm
    text_secondary: '#6D5D6E',
    card_bg: '#FFFFFF',
    card_border: '#E8DDD8',
    success: '#8E3E63',         // Hồng tím sẫm
    warning: '#C08261',         // Rose Gold
    error: '#C08261',
    gradient: 'linear-gradient(135deg, #F3E8E8 0%, #FFFFFF 100%)',
    isDark: false,
  },

  // 5. "Hồng Kẹo Ngọt Chốt Đơn" - Nổi bật, may mắn
  candy_sales: {
    id: 'candy_sales',
    name: 'Chốt đơn bán hàng',
    description: 'Hồng Kẹo Ngọt Chốt Đơn',
    color: '#FF4D94',
    bg_primary: '#FFFFFF',      // Trắng
    bg_secondary: '#F8F9FA',    // Xám nhạt
    accent: '#FF4D94',          // Hồng kẹo ngọt
    accent_dark: '#E81E63',
    text_primary: '#2D3436',    // Đen
    text_secondary: '#555555',
    card_bg: '#FFFFFF',
    card_border: '#FFE0ED',
    success: '#7FD8BE',         // Xanh bạc hà
    warning: '#FF4D94',         // Hồng kẹo
    error: '#FF4D94',
    gradient: 'linear-gradient(135deg, #FF4D94 0%, #7FD8BE 100%)',
    isDark: false,
  },

  // ============ THEMES DÀNH CHO NAM GIỚI ============

  // 1. "Bản Lĩnh Thép" (Iron Stealth)
  iron_stealth: {
    id: 'iron_stealth',
    name: 'Bản Lĩnh Thép',
    description: 'Hơi Thở Thép - Kỹ thuật, Chính xác, Tối giản',
    color: '#00E5FF',
    bg_primary: '#121212',      // Đen nhám sâu
    bg_secondary: '#1E1E1E',    // Xám đen than
    accent: '#00E5FF',          // Xanh Cyan điện tử
    accent_dark: '#00BFFF',     // Cyan đậm
    text_primary: '#FFFFFF',    // Trắng tinh
    text_secondary: '#B0B0B0',
    card_bg: '#1E1E1E',
    card_border: '#333333',
    success: '#00E5FF',
    warning: '#FFB800',
    error: '#FF4444',
    gradient: 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
    isDark: true,
    hasGlow: true,
  },

  // 2. "Đế Chế Xanh Navy" (Classic Gentleman)
  navy_gentleman: {
    id: 'navy_gentleman',
    name: 'Đế Chế Xanh Navy',
    description: 'Quý Ông Lịch Lãm - Doanh nhân, Tài chính, Bất động sản',
    color: '#1B263B',
    bg_primary: '#F4F4F4',      // Trắng xám nhẹ
    bg_secondary: '#FFFFFF',    // Trắng tinh
    accent: '#1B263B',          // Xanh Navy đậm
    accent_dark: '#0D1B2A',     // Xanh đen
    text_primary: '#0D1B2A',    // Xanh đen
    text_secondary: '#5A6A7A',
    card_bg: '#FFFFFF',
    card_border: '#E0E1DD',     // Xám bạc
    success: '#1B263B',
    warning: '#FF6B35',
    error: '#D62828',
    gradient: 'linear-gradient(135deg, #F4F4F4 0%, #FFFFFF 100%)',
    isDark: false,
  },

  // 3. "Sói Đêm Độc Hành" (Deep Forest Maverick)
  forest_maverick: {
    id: 'forest_maverick',
    name: 'Sói Đêm Độc Hành',
    description: 'Độc Bản Rừng Già - Tự do, Outdoor, Bền vững',
    color: '#395B64',
    bg_primary: '#2C3333',      // Xanh rêu đá đậm
    bg_secondary: '#395B64',    // Xanh Slate
    accent: '#E7F6F2',          // Trắng bạc hà
    accent_dark: '#CC5500',     // Cam đất
    text_primary: '#FFFFFF',
    text_secondary: '#D0D0D0',
    card_bg: '#395B64',
    card_border: '#5A8A8A',
    success: '#7CB342',         // Xanh lục
    warning: '#CC5500',         // Cam đất
    error: '#E57373',
    gradient: 'linear-gradient(135deg, #2C3333 0%, #395B64 100%)',
    isDark: true,
  },

  // 4. "Thung Lũng Tỷ Đô" (Silicon Valley Blue)
  silicon_valley: {
    id: 'silicon_valley',
    name: 'Thung Lũng Tỷ Đô',
    description: 'Tỉ Phú Công Nghệ - Startup, Crypto, Digital Marketing',
    color: '#F0B90B',
    bg_primary: '#0B0E11',      // Nền sàn giao dịch tài chính
    bg_secondary: '#1A1D23',    // Xám đen sâu
    accent: '#F0B90B',          // Vàng Gold rực rỡ
    accent_dark: '#E6A707',     // Gold đậm
    text_primary: '#FFFFFF',
    text_secondary: '#C0C0C0',
    card_bg: '#1A1D23',
    card_border: '#2D3139',
    success: '#2DBD96',         // Xanh lục thắng lợi
    warning: '#F0B90B',         // Vàng Gold
    error: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #0B0E11 0%, #1A1D23 100%)',
    isDark: true,
    hasGlow: true,
  },

  // 5. "Đêm Đô Thị" (Midnight Racer)
  midnight_racer: {
    id: 'midnight_racer',
    name: 'Đêm Đô Thị',
    description: 'Đêm Đô Thị - Tốc độ, Mạnh mẽ, Cá tính',
    color: '#FF3131',
    bg_primary: '#000000',      // Đen tuyệt đối
    bg_secondary: '#1A1A1A',    // Đen sâu
    accent: '#FF3131',          // Đỏ rực
    accent_dark: '#FF5E13',     // Cam cháy
    text_primary: '#FFFFFF',
    text_secondary: '#D0D0D0',
    card_bg: '#1A1A1A',
    card_border: '#333333',
    success: '#FF3131',         // Đỏ rực
    warning: '#FF5E13',         // Cam cháy
    error: '#FF1744',
    gradient: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
    isDark: true,
    hasGlow: true,
  },
};

// Helper function để lấy theme
export const getTheme = (themeId) => {
  return colorSchemes[themeId] || colorSchemes.muse_pink;
};

// Get all theme names for selector
export const getThemeList = () => {
  return Object.values(colorSchemes).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    color: theme.color || theme.accent,
  }));
};

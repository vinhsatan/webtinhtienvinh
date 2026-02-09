# 🎨 HỆ THỐNG MÀU SẮC CHUYÊN NGHIỆP - COMPREHENSIVE COLOR SYSTEM

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [10 Chủ Đề Màu](#10-chủ-đề-màu)
3. [Cấu Trúc Màu Sắc](#cấu-trúc-màu-sắc)
4. [Sử Dụng CSS Variables](#sử-dụng-css-variables)
5. [Các Thành Phần Được Áp Dụng](#các-thành-phần-được-áp-dụng)
6. [Hướng Dẫn Phát Triển](#hướng-dẫn-phát-triển)

---

## 🎯 Tổng Quan

Hệ thống màu sắc này cung cấp:
- ✅ **10 chủ đề màu** được thiết kế chuyên nghiệp (5 nữ tính + 5 nam tính)
- ✅ **CSS Custom Properties** cho dễ dàng áp dụng toàn bộ ứng dụng
- ✅ **Hỗ trợ Dark Mode** tự động dựa trên theme
- ✅ **Glow Effects** cho themes neon/hiệu ứng
- ✅ **Smooth Transitions** khi đổi theme
- ✅ **Persistent Storage** - lưu theme preference vào localStorage
- ✅ **Accessibility** - Đảm bảo contrast và readability

---

## 🎨 10 Chủ Đề Màu

### 👩 THEMES DÀNH CHO PHỤ NỮ (Nữ Tính, Mềm Mại)

#### 1. **Hồng Phấn Nàng Thơ** (`muse_pink`)
- **Màu sắc**: #FFB7C5 (Hồng hoa anh đào)
- **Phong cách**: Nhẹ nhàng, dịu dàng, hiện đại
- **Đối tượng**: Phụ nữ trẻ, lạc quan
- **Nền**: #FFF5F7 (Hồng nhạt) → #FFFFFF (Trắng)
- **Chữ**: #6D5D6E (Xám tím) → #8B7A8B (Xám nhẹ)

#### 2. **Cánh Sen Quyền Lực** (`empress_fuchsia`)
- **Màu sắc**: #FF007F (Hồng cánh sen đậm)
- **Phong cách**: Neon, mạnh mẽ, quyến rũ
- **Đối tượng**: Phụ nữ quyền lực
- **Nền**: #1A1A1D (Đen than) → #2D2D31 (Xám đen)
- **Chữ**: #FFFFFF (Trắng) → #E0E0E0 (Xám sáng)
- **Đặc tính**: Glow effect, Dark mode

#### 3. **Mật Đào Ngọt Ngào** (`sweetie_peach`)
- **Màu sắc**: #FF6B6B (Hồng cam san hô)
- **Phong cách**: Gradient, dễ thương, ấm áp
- **Đối tượng**: Kinh doanh nhỏ, bán hàng online
- **Nền**: #FEF1E6 (Kem đào) → #FFFFFF (Trắng)
- **Chữ**: #4A4A4A (Xám đậm) → #6B6B6B (Xám)
- **Gradient**: #FF9A9E → #FAD0C4

#### 4. **Quý Cô Thượng Lưu** (`velvet_rose`)
- **Màu sắc**: #C08261 (Rose Gold sang trọng)
- **Phong cách**: Cổ điển, sang trọng, quý phái
- **Đối tượng**: Phụ nữ business cao cấp
- **Nền**: #F3E8E8 (Hồng tro) → #FFFFFF (Trắng)
- **Chữ**: #522258 (Hồng tím sẫm) → #6D5D6E (Xám tím)

#### 5. **Hồng Kẹo Ngọt Chốt Đơn** (`candy_sales`)
- **Màu sắc**: #FF4D94 (Hồng kẹo ngọt rực)
- **Phong cách**: Năng động, bán hàng, may mắn
- **Đối tượng**: Kinh doanh online, bán hàng
- **Nền**: #FFFFFF (Trắng) → #F8F9FA (Xám nhạt)
- **Chữ**: #2D3436 (Đen) → #555555 (Xám)
- **Gradient**: #FF4D94 → #7FD8BE (Xanh bạc hà)

### 👨 THEMES DÀNH CHO NAM GIỚI (Mạnh Mẽ, Chuyên Nghiệp)

#### 6. **Bản Lĩnh Thép** (`iron_stealth`)
- **Màu sắc**: #00E5FF (Xanh Cyan điện tử)
- **Phong cách**: Kỹ thuật, chính xác, tối giản
- **Đối tượng**: IT, lập trình viên, tech guys
- **Nền**: #121212 (Đen nhám) → #1E1E1E (Xám đen)
- **Chữ**: #FFFFFF (Trắng) → #B0B0B0 (Xám sáng)
- **Đặc tính**: Glow effect, Dark mode, Cyan accent

#### 7. **Đế Chế Xanh Navy** (`navy_gentleman`)
- **Màu sắc**: #1B263B (Xanh Navy cổ điển)
- **Phong cả**: Quý ông lịch lãm, doanh nhân
- **Đối tượng**: CEO, doanh nhân, bất động sản
- **Nền**: #F4F4F4 (Trắng xám) → #FFFFFF (Trắng)
- **Chữ**: #0D1B2A (Xanh đen) → #5A6A7A (Xanh xám)
- **Cảm giác**: Professional, tin tưởng, ổn định

#### 8. **Sói Đêm Độc Hành** (`forest_maverick`)
- **Màu sắc**: #395B64 (Xanh Slate rừng)
- **Phong cách**: Tự do, outdoor, bền vững
- **Đối tượng**: Startup, outdoor, thể thao
- **Nền**: #2C3333 (Xanh rêu) → #395B64 (Xanh Slate)
- **Chữ**: #FFFFFF (Trắng) → #D0D0D0 (Xám sáng)
- **Accent**: #E7F6F2 (Trắng bạc hà)

#### 9. **Thung Lũng Tỷ Đô** (`silicon_valley`)
- **Màu sắc**: #F0B90B (Vàng Gold rực)
- **Phong cách**: Crypto, fintech, startup
- **Đối tượng**: Tỷ phú công nghệ, trader
- **Nền**: #0B0E11 (Đen sàn giao dịch) → #1A1D23 (Xám đen)
- **Chữ**: #FFFFFF (Trắng) → #C0C0C0 (Xám bạc)
- **Đặc tính**: Glow effect, Dark mode, Gold accent

#### 10. **Đêm Đô Thị** (`midnight_racer`)
- **Màu sắc**: #FF3131 (Đỏ rực cháy)
- **Phong cách**: Tốc độ, mạnh mẽ, cá tính
- **Đối tượng**: Kinh doanh tích cực, sales, startup
- **Nền**: #000000 (Đen tuyệt) → #1A1A1A (Đen sâu)
- **Chữ**: #FFFFFF (Trắng) → #D0D0D0 (Xám sáng)
- **Đặc tính**: Glow effect, Dark mode, Red accent

---

## 🎨 Cấu Trúc Màu Sắc

Mỗi theme bao gồm **14 thuộc tính màu**:

```javascript
{
  id: 'theme_id',                    // Định danh theme
  name: 'Tên hiển thị',              // Tên hiển thị cho user
  description: 'Mô tả chi tiết',     // Mô tả theme
  color: '#XXXXXX',                  // Màu chính (hiển thị)
  
  // Layout & Background
  bg_primary: '#XXXXXX',             // Màu nền chính (body)
  bg_secondary: '#XXXXXX',           // Màu nền phụ (cards, sections)
  
  // Text Colors
  text_primary: '#XXXXXX',           // Chữ chính (headings, body text)
  text_secondary: '#XXXXXX',         // Chữ phụ (labels, hints)
  
  // Components
  accent: '#XXXXXX',                 // Màu nhấn chính (buttons, links)
  accent_dark: '#XXXXXX',            // Màu nhấn khi hover
  card_bg: '#XXXXXX',                // Nền card/box
  card_border: '#XXXXXX',            // Đường viền card
  
  // Status Colors
  success: '#XXXXXX',                // Thành công (xanh)
  warning: '#XXXXXX',                // Cảnh báo (vàng/cam)
  error: '#XXXXXX',                  // Lỗi (đỏ)
  
  // Effects
  gradient: 'linear-gradient(...)',   // Gradient background
  isDark: boolean,                   // Mode tối?
  hasGlow: boolean,                  // Có glow effect?
}
```

---

## 🔧 Sử Dụng CSS Variables

Tất cả màu sắc được áp dụng qua CSS custom properties:

```css
:root {
  --bg-primary: #FFF5F7;
  --bg-secondary: #FFFFFF;
  --accent: #FFB7C5;
  --text-primary: #6D5D6E;
  --text-secondary: #8B7A8B;
  --card-bg: #FFFFFF;
  --card-border: #FFCCDD;
  --success: #FFB7C5;
  --warning: #FFB7C5;
  --error: #FF9AB5;
}
```

### Sử dụng trong CSS:
```css
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.button {
  background-color: var(--accent);
  color: white;
}

.card {
  background-color: var(--card-bg);
  border-color: var(--card-border);
}
```

---

## 🎯 Các Thành Phần Được Áp Dụng

### Thành Phần Áp Dụng Tự Động:
- ✅ **Nền trang** (Body background)
- ✅ **Chữ/Text** (Headings, paragraphs, labels)
- ✅ **Buttons** (Primary, secondary, hover states)
- ✅ **Cards** (Background, borders, shadows)
- ✅ **Input Fields** (Background, borders, focus states)
- ✅ **Links** (Color, hover states)
- ✅ **Tables** (Header, rows, borders)
- ✅ **Badges** (Status indicators)
- ✅ **Progress Bars** (Charts, graphs)
- ✅ **Scrollbars** (Track, thumb)
- ✅ **Modals** (Background, text, borders)
- ✅ **Alerts** (Success, warning, error)
- ✅ **Transitions** (Smooth color changes)

### Tailwind Classes Bị Override:
```javascript
.bg-blue-600      → var(--accent)
.bg-red-600       → var(--error)
.border-gray-200  → var(--card-border)
.text-gray-900    → var(--text-primary)
.bg-white         → var(--card-bg)
```

---

## 🚀 Hướng Dẫn Phát Triển

### 1. Thay Đổi Theme trong Code:
```javascript
import { useTheme } from '@/contexts/ThemeContext';

export default function MyComponent() {
  const { currentTheme, switchTheme, refreshPage } = useTheme();

  const handleThemeChange = (themeId) => {
    switchTheme(themeId);     // Thay đổi theme
    refreshPage();            // Refresh để áp dụng toàn bộ
  };

  return (
    <button onClick={() => handleThemeChange('navy_gentleman')}>
      Chuyển sang Navy
    </button>
  );
}
```

### 2. Lấy Màu Hiện Tại:
```javascript
import { useTheme } from '@/contexts/ThemeContext';

export default function Component() {
  const { currentTheme } = useTheme();

  return (
    <div style={{ color: currentTheme.text_primary }}>
      {currentTheme.name}
    </div>
  );
}
```

### 3. Sử Dụng Theme Utils:
```javascript
import { 
  getThemeColor, 
  isThemeDark, 
  getContrastColor 
} from '@/themes/themeUtils.js';

// Lấy màu accent
const accentColor = getThemeColor('accent');

// Kiểm tra dark mode
if (isThemeDark('navy_gentleman')) {
  // Apply dark mode styles
}

// Lấy màu đối lập
const contrastColor = getContrastColor('#FF007F');
```

### 4. Tạo Custom Theme:
```javascript
import { createCustomTheme } from '@/themes/themeUtils.js';

const myCustomTheme = createCustomTheme('#FF6B6B', {
  name: 'My Custom Theme',
  isDark: true,
  hasGlow: true
});
```

### 5. File Cấu Trúc:
```
src/
├── themes/
│   ├── colorSchemes.js      // 10 themes định nghĩa
│   ├── themeUtils.js        // Helper functions
│   └── README.md            // Documentation (this file)
├── contexts/
│   └── ThemeContext.jsx     // Theme provider & hook
├── styles/
│   ├── themeColors.css      // Global theme CSS
│   └── index.css            // CSS variables
├── components/
│   └── SettingsModule.jsx   // Theme selector UI
└── app/
    └── root.tsx            // App wrapper
```

---

## 📊 CSS Variable Áp Dụng

### Được Áp Dụng Cho:

| Component | CSS Variable | Ví dụ |
|-----------|-------------|--------|
| Body | `--bg-primary` | Background page |
| Text | `--text-primary` | Chữ chính |
| Buttons | `--accent` | Màu nút |
| Cards | `--card-bg` | Nền card |
| Borders | `--card-border` | Viền |
| Links | `--accent` | Màu link |
| Success | `--success` | Badge thành công |
| Warning | `--warning` | Cảnh báo |
| Error | `--error` | Lỗi |

---

## 🎬 Flow Thay Đổi Theme

```
User click theme selector
    ↓
SettingsModule.jsx: switchTheme(themeId)
    ↓
ThemeContext.jsx: setThemeId(newThemeId)
    ↓
useEffect: applyThemeColors(currentTheme)
    ↓
Apply CSS variables to document root
    ↓
Apply body classes (dark/light)
    ↓
Save to localStorage 'finmaster_theme_id'
    ↓
User click "Cập nhật & Tải Lại"
    ↓
refreshPage(): window.location.reload()
    ↓
All components re-render with new theme colors
```

---

## ✨ Đặc Tính Nâng Cao

### Dark Mode Tự Động:
Khi theme có `isDark: true`, tất cả text và backgrounds được điều chỉnh tự động.

### Glow Effects:
Themes với `hasGlow: true` có text-shadow glow effect (iron_stealth, empress_fuchsia, silicon_valley, midnight_racer).

### Gradient Support:
Mỗi theme có gradient property cho background:
```css
background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
```

### Smooth Transitions:
Tất cả color changes có transition 0.3s - 0.4s cubic-bezier(0.4, 0, 0.2, 1).

### Accessibility:
- ✅ Contrast ratios tuân theo WCAG standards
- ✅ Hỗ trợ prefers-reduced-motion
- ✅ Hỗ trợ prefers-contrast: more
- ✅ Focus states rõ ràng

---

## 🔄 Refresh & Update

Khi user chọn theme mới:
1. ✅ CSS variables cập nhật ngay lập tức
2. ⏳ Nếu cần refresh toàn bộ page:
   - Nhấn nút "Cập nhật & Tải Lại"
   - Page refresh với theme mới
   - localStorage được update
   - Theme persist khi reload page

---

## 📝 Notes Quan Trọng

- Không thay đổi logic ứng dụng, chỉ thay đổi màu sắc
- CSS variables áp dụng globally - tất cả components tự động đổi màu
- Tailwind classes bị override bởi CSS variables
- Dark mode được xử lý qua `isDark` flag trong theme
- Theme được lưu vào localStorage và persist giữa các session
- Glow effects chỉ cho themes with `hasGlow: true`

---

## 🎓 Best Practices

1. **Luôn sử dụng CSS variables** thay vì hardcode colors
2. **Test tất cả themes** để đảm bảo contrast và readability
3. **Sử dụng semantic color names** (success, warning, error) thay vì red, green
4. **Kiểm tra dark mode** trên tất cả components
5. **Tránh fixed colors** - dùng var(--accent) thay vì #FF007F

---

## 🐛 Troubleshooting

### Colors không thay đổi?
1. Kiểm tra CSS import: `import '../styles/themeColors.css'`
2. Kiểm tra ThemeProvider wrapper ở root.tsx
3. Hard refresh (Ctrl+Shift+Delete) browser cache

### Một component màu sắc sai?
1. Kiểm tra inline styles (không được override)
2. Kiểm tra Tailwind classes priority
3. Thêm `!important` nếu cần: `color: var(--text-primary) !important;`

### Glow effect không hiển thị?
1. Kiểm tra `hasGlow: true` trong theme
2. Kiểm tra CSS: `.glow { text-shadow: 0 0 10px var(--accent); }`
3. Kiểm tra body class: `<body class="theme-glow">`

---

**Tạo bởi**: Color System Expert  
**Cập nhật lần cuối**: January 2026  
**Phiên bản**: 1.0.0

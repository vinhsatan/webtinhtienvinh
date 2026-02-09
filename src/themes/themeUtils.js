/**
 * COMPREHENSIVE COLOR SYSTEM UTILITIES
 * Professional color management across the entire application
 */

import { colorSchemes, getTheme } from './colorSchemes.js';

/**
 * Apply theme colors with smooth transitions
 * @param {string} themeId - Theme identifier
 */
export const applyTheme = (themeId) => {
  const theme = getTheme(themeId);
  if (!theme) return;

  const root = document.documentElement;

  // Apply CSS variables
  Object.entries({
    '--bg-primary': theme.bg_primary,
    '--bg-secondary': theme.bg_secondary,
    '--accent': theme.accent,
    '--accent-dark': theme.accent_dark,
    '--text-primary': theme.text_primary,
    '--text-secondary': theme.text_secondary,
    '--card-bg': theme.card_bg,
    '--card-border': theme.card_border,
    '--success': theme.success,
    '--warning': theme.warning,
    '--error': theme.error,
  }).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply body classes
  if (theme.isDark) {
    document.body.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.body.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }

  // Apply glow effect if theme has it
  if (theme.hasGlow) {
    document.body.classList.add('theme-glow');
  } else {
    document.body.classList.remove('theme-glow');
  }
};

/**
 * Get a color value from the current theme
 * @param {string} colorKey - Color property name
 * @param {string} themeId - Optional theme ID
 * @returns {string} - Color hex value
 */
export const getThemeColor = (colorKey, themeId = null) => {
  const saved = themeId || localStorage.getItem('finmaster_theme_id');
  const theme = getTheme(saved || 'muse_pink');
  return theme[colorKey] || theme.accent;
};

/**
 * Create a gradient from theme colors
 * @param {string} themeId - Theme identifier
 * @returns {string} - CSS gradient
 */
export const getThemeGradient = (themeId) => {
  const theme = getTheme(themeId);
  return theme.gradient || `linear-gradient(135deg, ${theme.bg_primary} 0%, ${theme.bg_secondary} 100%)`;
};

/**
 * Check if theme is dark mode
 * @param {string} themeId - Theme identifier
 * @returns {boolean}
 */
export const isThemeDark = (themeId) => {
  const theme = getTheme(themeId);
  return theme.isDark || false;
};

/**
 * Check if theme has glow effect
 * @param {string} themeId - Theme identifier
 * @returns {boolean}
 */
export const hasThemeGlow = (themeId) => {
  const theme = getTheme(themeId);
  return theme.hasGlow || false;
};

/**
 * Get complementary color for contrast
 * @param {string} colorHex - Hex color value
 * @returns {string} - Contrasting color
 */
export const getContrastColor = (colorHex) => {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Convert hex to RGB
 * @param {string} hex - Hex color
 * @returns {object} - RGB object
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert RGB to hex
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {string} - Hex color
 */
export const rgbToHex = (r, g, b) => {
  return `#${[r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }).join('')}`;
};

/**
 * Get all theme categories
 * @returns {object} - Themes organized by category
 */
export const getThemesByCategory = () => {
  const feminine = Object.values(colorSchemes).filter(
    (t) => !['iron_stealth', 'navy_gentleman', 'forest_maverick', 'silicon_valley', 'midnight_racer'].includes(t.id)
  );

  const masculine = Object.values(colorSchemes).filter(
    (t) => ['iron_stealth', 'navy_gentleman', 'forest_maverick', 'silicon_valley', 'midnight_racer'].includes(t.id)
  );

  return { feminine, masculine };
};

/**
 * Get theme recommendations based on use case
 * @param {string} useCase - 'business', 'retail', 'tech', 'luxury', 'casual'
 * @returns {array} - Recommended themes
 */
export const getRecommendedThemes = (useCase) => {
  const recommendations = {
    business: ['navy_gentleman', 'iron_stealth', 'velvet_rose'],
    retail: ['candy_sales', 'empress_fuchsia', 'midnight_racer'],
    tech: ['silicon_valley', 'iron_stealth', 'forest_maverick'],
    luxury: ['velvet_rose', 'navy_gentleman', 'muse_pink'],
    casual: ['sweetie_peach', 'muse_pink', 'candy_sales'],
  };

  const themeIds = recommendations[useCase] || recommendations.business;
  return themeIds.map((id) => getTheme(id));
};

/**
 * Export current theme as JSON
 * @param {string} themeId - Theme identifier
 * @returns {string} - JSON string
 */
export const exportTheme = (themeId) => {
  const theme = getTheme(themeId);
  return JSON.stringify(theme, null, 2);
};

/**
 * Import theme from JSON
 * @param {string} jsonString - JSON theme data
 * @returns {object|null} - Theme object or null if invalid
 */
export const importTheme = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

/**
 * Create custom theme based on primary color
 * @param {string} primaryColor - Primary hex color
 * @param {object} options - Additional options
 * @returns {object} - Custom theme object
 */
export const createCustomTheme = (primaryColor, options = {}) => {
  const defaults = {
    name: 'Custom Theme',
    description: 'Custom color scheme',
    isDark: false,
    ...options,
  };

  return {
    id: `custom_${Date.now()}`,
    name: defaults.name,
    description: defaults.description,
    color: primaryColor,
    bg_primary: defaults.isDark ? '#1A1A1D' : '#FFFFFF',
    bg_secondary: defaults.isDark ? '#2D2D31' : '#F8F9FA',
    accent: primaryColor,
    accent_dark: primaryColor,
    text_primary: defaults.isDark ? '#FFFFFF' : '#1A1A1D',
    text_secondary: defaults.isDark ? '#B0B0B0' : '#666666',
    card_bg: defaults.isDark ? '#2D2D31' : '#FFFFFF',
    card_border: defaults.isDark ? '#444444' : '#E0E0E0',
    success: primaryColor,
    warning: primaryColor,
    error: defaults.isDark ? '#FF6B6B' : '#FF5252',
    gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${options.secondaryColor || primaryColor} 100%)`,
    isDark: defaults.isDark,
    hasGlow: options.hasGlow || false,
  };
};

/**
 * Validate theme object
 * @param {object} theme - Theme to validate
 * @returns {boolean} - Is valid theme
 */
export const isValidTheme = (theme) => {
  const requiredProperties = [
    'id',
    'name',
    'color',
    'bg_primary',
    'bg_secondary',
    'accent',
    'text_primary',
    'text_secondary',
    'card_bg',
    'card_border',
    'success',
    'warning',
    'error',
  ];

  return (
    theme &&
    typeof theme === 'object' &&
    requiredProperties.every((prop) => prop in theme && typeof theme[prop] === 'string')
  );
};

export default {
  applyTheme,
  getThemeColor,
  getThemeGradient,
  isThemeDark,
  hasThemeGlow,
  getContrastColor,
  hexToRgb,
  rgbToHex,
  getThemesByCategory,
  getRecommendedThemes,
  exportTheme,
  importTheme,
  createCustomTheme,
  isValidTheme,
};

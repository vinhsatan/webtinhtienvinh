import { createContext, useState, useContext, useEffect } from 'react';
import { colorSchemes, getTheme } from '../themes/colorSchemes.js';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    // Load từ localStorage
    const saved = localStorage.getItem('finmaster_theme_id');
    return saved || 'muse_pink';
  });

  const currentTheme = getTheme(themeId);

  // Áp dụng CSS variables đến root element
  const applyThemeColors = (theme) => {
    const root = document.documentElement;
    
    // Primary colors
    root.style.setProperty('--bg-primary', theme.bg_primary);
    root.style.setProperty('--bg-secondary', theme.bg_secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-dark', theme.accent_dark);
    root.style.setProperty('--text-primary', theme.text_primary);
    root.style.setProperty('--text-secondary', theme.text_secondary);
    
    // Component colors
    root.style.setProperty('--card-bg', theme.card_bg);
    root.style.setProperty('--card-border', theme.card_border);
    
    // Status colors
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--error', theme.error);
    root.style.setProperty('--info', theme.accent);
    
    // Apply to body
    if (theme.isDark) {
      document.documentElement.style.colorScheme = 'dark';
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.style.colorScheme = 'light';
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    
    // Background gradient support
    document.body.style.background = `linear-gradient(135deg, ${theme.bg_primary} 0%, ${theme.bg_secondary} 100%)`;
  };

  // Apply theme on mount and when themeId changes
  useEffect(() => {
    applyThemeColors(currentTheme);
    localStorage.setItem('finmaster_theme_id', themeId);
  }, [themeId, currentTheme]);

  const switchTheme = (newThemeId) => {
    if (colorSchemes[newThemeId]) {
      setThemeId(newThemeId);
    }
  };

  // Refresh the page to apply new theme fully
  const refreshPage = () => {
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeId, 
      currentTheme, 
      switchTheme,
      refreshPage,
      applyThemeColors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook để sử dụng theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

import { createContext, useContext, useState, useEffect } from 'react';
import { clearAllStoredData } from '@/utils/localStorage';

const AuthContext = createContext(null);

// Use relative URL for API calls - works for both localhost and subdomain
// When accessed from https://app.n8nvinhsatan.site, API calls will go to the same domain
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Auth mode (single-user vs multi-user)
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase();
// Display hint only — password is NEVER in the client bundle
const ENV_AUTH_EMAIL = import.meta.env.VITE_AUTH_EMAIL || '';

// Chế độ test: không lưu trữ dữ liệu - xóa mỗi lần load (giữ auth)
const NO_PERSIST = import.meta.env.VITE_NO_PERSIST === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    // Chế độ test: xóa dữ liệu app mỗi lần load (giữ đăng nhập)
    if (NO_PERSIST) {
      clearAllStoredData(false);
      console.log('[Auth] Chế độ test: đã xóa dữ liệu lưu trữ (giữ auth)');
    }

    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    console.log('[AuthContext] Loading auth:', { 
      hasToken: !!savedToken, 
      hasUser: !!savedUser 
    });
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        console.log('[AuthContext] Auth loaded successfully');
      } catch (error) {
        console.error('[AuthContext] Error loading auth data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } else {
      console.log('[AuthContext] No saved auth data');
    }
    setLoading(false);
  }, []);

  const register = async (email, password, name) => {
    // Disable registration in single-user production mode
    if (AUTH_MODE === 'single_user' || AUTH_MODE === 'single-user' || AUTH_MODE === 'singleuser') {
      return { success: false, error: 'Registration disabled in single-user mode' };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Đăng ký thất bại' };
      }
    } catch (error) {
      return { success: false, error: 'Lỗi kết nối: ' + error.message };
    }
  };

  const login = async (email, password) => {
    // Always validate via server API — credentials are never stored in the JS bundle.
    // The server handles both single_user (AUTH_PASSWORD_HASH in .env) and multi-user (DB).
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      return { success: false, error: 'Lỗi kết nối: ' + error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // CRITICAL: X\u00f3a t\u1ea5t c\u1ea3 sync data c\u1ee7a user c\u0169 \u0111\u1ec3 tr\u00e1nh ghi \u0111\u00e8 khi \u0111\u0103ng nh\u1eadp nick m\u1edbi
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // X\u00f3a c\u00e1c key sync v\u00e0 timestamp
        if (key && (key.includes('_sync_user_') || key.includes('finmaster_last_sync_user_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[Logout] Cleared sync data:', keysToRemove.length, 'keys');
    } catch (error) {
      console.error('[Logout] Error clearing sync data:', error);
    }
  };

  const verifyPassword = async (password) => {
    if (!token) return { success: false, error: 'Chưa đăng nhập' };
    try {
      const url = `${API_BASE_URL || ''}/api/auth/verify-password`.replace(/\/+/g, '/');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const contentType = response.headers.get('Content-Type') || '';
      const text = await response.text();
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          error: 'Lỗi kết nối: API trả về HTML thay vì JSON. Kiểm tra backend đang chạy và URL đúng.',
        };
      }
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: 'Lỗi kết nối: Server trả về dữ liệu không hợp lệ (không phải JSON)' };
      }
      if (response.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Mật khẩu không đúng' };
    } catch (error) {
      return { success: false, error: 'Lỗi kết nối: ' + error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    verifyPassword,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

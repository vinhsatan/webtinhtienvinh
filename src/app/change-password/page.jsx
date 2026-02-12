import { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
      return false;
    }
    if (!formData.newPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
      return false;
    }
    if (!formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng xác nhận mật khẩu mới' });
      return false;
    }
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải ít nhất 8 ký tự' });
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Đổi mật khẩu thành công! Bạn sẽ được đăng xuất.' 
        });
        
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Đổi mật khẩu thất bại' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Lỗi kết nối: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const pwd = formData.newPassword;
    if (pwd.length < 8) return { level: 0, text: '', color: 'bg-gray-300' };
    if (pwd.length < 12) return { level: 1, text: 'Yếu', color: 'bg-red-500' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { level: 2, text: 'Trung bình', color: 'bg-yellow-500' };
    if (!/[!@#$%^&*]/.test(pwd)) return { level: 3, text: 'Mạnh', color: 'bg-blue-500' };
    return { level: 4, text: 'Rất mạnh', color: 'bg-green-500' };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Đổi Mật Khẩu
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <p className={message.type === 'success' 
                ? 'text-green-800 dark:text-green-300' 
                : 'text-red-800 dark:text-red-300'}>
                {message.text}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật Khẩu Hiện Tại
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.text && (
                      <span className={`text-xs font-semibold ${
                        passwordStrength.level === 1 ? 'text-red-600 dark:text-red-400' :
                        passwordStrength.level === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                        passwordStrength.level === 3 ? 'text-blue-600 dark:text-blue-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gợi ý: Sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.newPassword && formData.confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">Mật khẩu khớp</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-600 dark:text-red-400">Mật khẩu không khớp</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="w-full mt-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Quay lại trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

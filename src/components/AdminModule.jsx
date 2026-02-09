import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit2, Plus, Search, RefreshCw, Key, RotateCcw } from 'lucide-react';

export default function AdminModule() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [authError, setAuthError] = useState('');

  const isAdmin = user?.email === 'vinhsatan@gmail.com';

  // Debug log
  useEffect(() => {
    console.log('[AdminModule] User info:', { user, token: token ? 'exists' : 'missing', isAdmin });
  }, [user, token, isAdmin]);

  useEffect(() => {
    if (isAdmin && token) {
      loadUsers();
    } else if (!isAdmin && user) {
      setAuthError(`Chỉ tài khoản Admin (vinhsatan@gmail.com) mới có quyền. Current: ${user.email}`);
    }
  }, [isAdmin, token, user]);

  const loadUsers = async () => {
    if (!token) {
      setAuthError('Token not found');
      setError('Lỗi xác thực: Token không tìm thấy');
      return;
    }

    setLoading(true);
    setError('');
    setAuthError('');

    try {
      console.log('[AdminModule] Loading users with token...');
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminModule] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[AdminModule] API error:', data);
        throw new Error(data.error || `Failed to load users (${response.status})`);
      }

      const data = await response.json();
      console.log('[AdminModule] Loaded users:', data);
      setUsers(data.users || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading users';
      setError(errorMsg);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa ${userEmail}? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter((u) => u.id !== userId));
      alert('Xóa tài khoản thành công!');
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email);
    setEditPassword(''); // Clear password field
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !token) return;

    try {
      // Update name and email
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const data = await response.json();

      // Update password if provided
      if (editPassword.trim()) {
        const passwordResponse = await fetch(`/api/admin/users/${editingUser.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newPassword: editPassword,
          }),
        });

        if (!passwordResponse.ok) {
          const passwordData = await passwordResponse.json();
          throw new Error(passwordData.error || 'Failed to update password');
        }
      }

      setUsers(users.map((u) => (u.id === editingUser.id ? data.user : u)));
      setShowEditModal(false);
      setEditingUser(null);
      alert('Cập nhật tài khoản thành công!');
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleResetUserData = async (userId, userName) => {
    if (!confirm(`⚠️ XÓA TOÀN BỘ DỮ LIỆU của ${userName}?\n\nThao tác này sẽ xóa:\n- Tất cả sản phẩm\n- Tất cả giao dịch\n- Tất cả đơn hàng\n- Reset ví về 0\n\nTài khoản đăng nhập vẫn giữ nguyên.\n\nBạn có chắc chắn?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset user data');
      }

      alert('✅ Đã xóa toàn bộ dữ liệu của người dùng!');
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin && user) {
    return (
      <div className="flex-1 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">🔒 Quyền Admin</h2>
          <p className="text-red-700 dark:text-red-300 mb-2">
            Chỉ tài khoản Admin (vinhsatan@gmail.com) mới có quyền truy cập phần này.
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm">
            Tài khoản hiện tại: <strong>{user.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Loading auth
  if (!user || !token) {
    return (
      <div className="flex-1 flex items-center justify-center bg-deepSlate-800 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-deepSlate-700"></div>
          <p className="mt-4 text-emerald-500 dark:text-emerald-400">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-deepSlate-800 to-deepSlate-700 dark:from-gray-800 dark:to-gray-700 border-b border-deepSlate-700 dark:border-deepSlate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-deepSlate-50 dark:text-deepSlate-100">👥 Quản Lý Tài Khoản</h2>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Làm tươi
          </button>
        </div>

        {/* Auth Error */}
        {authError && (
          <div className="mb-4 p-3 bg-deepSlate-800 dark:bg-deepSlate-800/20 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg text-deepSlate-400 text-deepSlate-300 text-sm">
            {authError}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-deepSlate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg bg-white dark:bg-gray-700 text-deepSlate-50 dark:text-deepSlate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500 dark:text-gray-400">Không tìm thấy tài khoản</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.name || 'Không có tên'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>ID: {user.id.slice(0, 8)}...</span>
                      <span>Tạo: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                      {user.password === '***' && <span className="text-blue-600 dark:text-blue-400">✓ Có mật khẩu</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleResetUserData(user.id, user.name || user.email)}
                      className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Reset dữ liệu"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          📊 Tổng: <strong>{users.length}</strong> tài khoản | Tìm thấy: <strong>{filteredUsers.length}</strong>
        </p>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Sửa Tài Khoản</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Key size={16} />
                  Mật khẩu mới (để trống nếu không đổi)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Chỉ nhập nếu muốn thay đổi mật khẩu
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

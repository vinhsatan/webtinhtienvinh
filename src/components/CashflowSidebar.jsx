import {
  Wallet,
  ShoppingBag,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  User,
  Shield,
  MessageCircle,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function CashflowSidebar({ activeModule, onModuleChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showBoiMenu, setShowBoiMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const MenuItem = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`
        relative w-full flex items-center gap-3 h-10 px-6 rounded-lg transition-all duration-150 ease-in-out
        hover:bg-deepSlate-700 dark:hover:bg-deepSlate-700
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0
        ${isActive ? "text-emerald-400 dark:text-emerald-400 bg-deepSlate-700/50 dark:bg-deepSlate-700/50" : "text-deepSlate-400 dark:text-deepSlate-400 hover:text-emerald-400 dark:hover:text-emerald-400"}
      `}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 dark:bg-emerald-400 rounded-r-full" />
      )}
      <Icon size={20} strokeWidth={1.5} className="flex-shrink-0" />
      <span className="text-sm font-normal whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
    </button>
  );

  return (
    <div className="w-72 bg-deepSlate-800 dark:bg-deepSlate-800 h-screen flex flex-col border-r border-deepSlate-700 dark:border-deepSlate-700">
      {/* Brand Block */}
      <div className="px-6 py-8 border-b border-deepSlate-700 dark:border-deepSlate-700 bg-deepSlate-900 dark:bg-deepSlate-900">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-xl font-bold">₫</span>
          </div>
          <div className="ml-3">
            <span className="text-2xl font-semibold text-deepSlate-50 dark:text-deepSlate-50 block">
              Bài Toán Của Sự Giàu Có
            </span>
            <span className="text-xs text-deepSlate-400 dark:text-deepSlate-400">
              Phần mềm miễn phí của Ngô Tiến Vinh
            </span>
            <span className="text-xs text-amber-400 dark:text-amber-400 font-medium block mt-1">
              ⚠️ Đang trong thời gian test
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
        <MenuItem
          id="wallets"
          icon={Wallet}
          label="Tổng quan Quỹ"
          isActive={activeModule === "wallets"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="orders"
          icon={ShoppingBag}
          label="Nhập Đơn Hàng"
          isActive={activeModule === "orders"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="ledger"
          icon={BookOpen}
          label="Sổ Thu Chi"
          isActive={activeModule === "ledger"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="reports"
          icon={BarChart3}
          label="Báo cáo"
          isActive={activeModule === "reports"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="pricing"
          icon={Calculator}
          label="💰 Tính Giá Bán"
          isActive={false}
          onClick={(id) => {
            if (id === "pricing") {
              window.open('https://tinhgiaban.n8nvinhsatan.site/', '_blank');
            } else {
              onModuleChange(id);
            }
          }}
        />
        <div className="space-y-1">
          <button
            onClick={() => setShowBoiMenu(!showBoiMenu)}
            className={`
              relative w-full flex items-center gap-3 h-10 px-6 rounded-lg transition-all duration-150 ease-in-out
              hover:bg-deepSlate-700 dark:hover:bg-deepSlate-700
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0
              text-deepSlate-400 dark:text-deepSlate-400 hover:text-emerald-400 dark:hover:text-emerald-400
            `}
          >
            <span className="text-lg">🎋</span>
            <span className="text-sm font-normal">Bói Toán</span>
            <ChevronDown 
              size={16} 
              strokeWidth={1.5} 
              className={`ml-auto flex-shrink-0 transition-transform duration-200 ${showBoiMenu ? 'rotate-180' : ''}`}
            />
          </button>
          {showBoiMenu && (
            <button
              onClick={() => {
                window.open('https://boidongxu.n8nvinhsatan.site/', '_blank');
              }}
              className={`
                relative w-full flex items-center gap-3 h-10 px-6 pl-12 rounded-lg transition-all duration-150 ease-in-out
                hover:bg-deepSlate-700 dark:hover:bg-deepSlate-700
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0
                text-deepSlate-400 dark:text-deepSlate-400 hover:text-emerald-400 dark:hover:text-emerald-400
              `}
            >
              <span className="text-sm font-normal">Bói Quẻ Bằng Xu</span>
            </button>
          )}
        </div>
        <MenuItem
          id="settings"
          icon={Settings}
          label="Cấu hình"
          isActive={activeModule === "settings"}
          onClick={onModuleChange}
        />
        {user?.email === 'vinhsatan@gmail.com' && (
          <MenuItem
            id="admin"
            icon={Shield}
            label="👥 Quản Lý Tài Khoản"
            isActive={activeModule === "admin"}
            onClick={onModuleChange}
          />
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="px-6 py-4 border-t border-deepSlate-700 dark:border-deepSlate-700">
        {user && (
          <div className="mb-3 p-3 bg-emerald-900/30 dark:bg-emerald-900/30 rounded-lg border border-emerald-800 dark:border-emerald-800">
            <p className="text-xs font-medium text-deepSlate-400 dark:text-deepSlate-400 mb-1">Đang đăng nhập:</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-deepSlate-50 dark:text-deepSlate-50 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-emerald-400 dark:text-emerald-400 truncate font-medium" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>

          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-500 dark:text-amber-500 hover:bg-amber-900/20 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

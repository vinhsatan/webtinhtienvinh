import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  TrendingUp,
} from "lucide-react";

export default function FinancialSidebar({ activeModule, onModuleChange }) {
  const MenuItem = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`
        relative w-full flex items-center h-10 px-6 rounded-lg transition-all duration-150 ease-in-out
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
        ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"}
      `}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 dark:bg-blue-400 rounded-r-full" />
      )}
      <Icon size={24} strokeWidth={1.5} className="flex-shrink-0" />
      <span className="ml-5 text-[15px] font-normal">{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 h-screen flex flex-col border-r border-gray-200 dark:border-gray-700">
      {/* Brand Block */}
      <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <span className="ml-3 text-2xl font-semibold text-gray-900 dark:text-white">
            FinMaster
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
        <MenuItem
          id="dashboard"
          icon={LayoutDashboard}
          label="Tổng quan"
          isActive={activeModule === "dashboard"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="sales"
          icon={ShoppingCart}
          label="Bán hàng & Mẫu đơn"
          isActive={activeModule === "sales"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="expenses"
          icon={Receipt}
          label="Chi phí & Định kỳ"
          isActive={activeModule === "expenses"}
          onClick={onModuleChange}
        />
        <MenuItem
          id="pl"
          icon={TrendingUp}
          label="Phân tích Lỗ Lãi"
          isActive={activeModule === "pl"}
          onClick={onModuleChange}
        />
      </nav>
    </div>
  );
}

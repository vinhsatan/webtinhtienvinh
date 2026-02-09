import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Zap,
  BarChart3,
  Target,
} from "lucide-react";
import "../styles/dashboard2026.css";

export default function DashboardModule({ salesData, expensesData }) {
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const totalRevenue = salesData.completedOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const totalExpenses = expensesData.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const netProfit = totalRevenue - totalRevenue * 0.6 - totalExpenses;
  const avgOrderValue = salesData.completedOrders.length > 0 
    ? totalRevenue / salesData.completedOrders.length 
    : 0;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const StatCard = ({ 
    title, 
    value, 
    trend, 
    trendValue, 
    icon: Icon, 
    group = "a" 
  }) => (
    <div className={`dashboard-grid-item`}>
      <div className={`dashboard-card group-${group}`}>
        <div className="card-header">
          <div className={`card-header-icon group-${group}-accent`}>
            <Icon size={18} />
          </div>
          <span className="card-header-title">{title}</span>
        </div>
        
        <div className="card-content">
          <div className="card-stat-container">
            <div className={`card-stat-value group-${group}-accent`}>
              {value}
            </div>
            <div className="card-stat-label">Hiện tại</div>
          </div>

          <div className="card-footer">
            <div className={`card-stat-change trend-${trend}`}>
              {trend === "up" ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              <span>{trendValue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-2026-wrapper">
      <div style={{ padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="mb-8">
          <h1 className="dashboard-title">Dashboard 2026</h1>
          <p className="dashboard-subtitle">
            Quản lý tài chính doanh nghiệp cao cấp
          </p>
        </div>

        {/* Main Stats Grid - Bento Style */}
        <div className="dashboard-grid">
          {/* Group B: Revenue (Male Businessman - Power) */}
          <StatCard
            title="Tổng Doanh Thu"
            value={formatVND(totalRevenue)}
            trend="up"
            trendValue="12.5%"
            icon={DollarSign}
            group="b"
          />

          {/* Group A: Expenses (Female CEO - Elegant) */}
          <StatCard
            title="Tổng Chi Phí"
            value={formatVND(totalExpenses)}
            trend="down"
            trendValue="3.2%"
            icon={ShoppingBag}
            group="a"
          />

          {/* Group C: Net Profit (Finance/Investment - Stable) */}
          <StatCard
            title="Lợi Nhuận Ròng"
            value={formatVND(netProfit)}
            trend="up"
            trendValue="18.7%"
            icon={TrendingUp}
            group="c"
          />

          {/* Additional Metrics */}
          <StatCard
            title="Giá Trị Đơn TB"
            value={formatVND(avgOrderValue)}
            trend="up"
            trendValue="5.3%"
            icon={Zap}
            group="b"
          />

          <StatCard
            title="Biên Lợi Nhuận"
            value={`${margin}%`}
            trend="up"
            trendValue="2.1%"
            icon={BarChart3}
            group="c"
          />

          <StatCard
            title="Đơn Hàng"
            value={salesData.completedOrders.length}
            trend="up"
            trendValue="8.4%"
            icon={Target}
            group="a"
          />

          {/* Activity Section - Takes 2 columns on large screens */}
          <div className="dashboard-grid-item large">
            <div className="dashboard-card group-b">
              <div className="card-header">
                <div className="card-header-icon group-b-accent">
                  <ShoppingBag size={18} />
                </div>
                <span className="card-header-title">Hoạt Động Gần Đây</span>
              </div>

              <div className="card-content">
                <div className="space-y-2">
                  {salesData.completedOrders.slice(0, 5).map((order, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-info">
                        <div className="activity-label">
                          Đơn hàng #{idx + 1}
                        </div>
                        <div className="activity-detail">
                          {order.items.length} sản phẩm
                        </div>
                      </div>
                      <div className="activity-amount group-b-accent">
                        {formatVND(order.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <span style={{ color: "#888", fontSize: "12px" }}>
                  Showing latest 5 transactions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

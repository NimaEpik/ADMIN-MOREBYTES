import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useInventory } from '../../context/InventoryContext';
import { LuUsers } from "react-icons/lu";
import {
  LuShoppingCart,
  LuClipboardList,
  LuBike,
  LuBell,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
} from 'react-icons/lu';
import './Dashboard.css';

// Time options for daily chart filter
const TIME_OPTIONS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM',
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_MAX = 30000;

// Hardcoded activity log entries
const ACTIVITY_LOG = [
  { time: '8:00 AM', user: 'Admin', activity: 'Added new menu item "Burger Combo"', status: 'Success' },
  { time: '8:32 AM', user: 'Admin', activity: 'Processed Order #1012', status: 'Success' },
  { time: '9:32 AM', user: 'Driver', activity: 'Accepted Delivery #1023', status: 'Success' },
  { time: '10:39 AM', user: 'Owner', activity: 'Generates Report', status: 'Success' },
  { time: '11:09 AM', user: 'Owner', activity: 'Deleted John Driver', status: 'Success' },
  { time: '11:40 AM', user: 'Admin', activity: 'Updated stock for chicken wing', status: 'Success' },
];

const DONUT_COLORS = {
  Preparing: '#FFA500',
  Pending: '#FACC15',
  Completed: '#3B82F6',
  Cancelled: '#EF4444',
  'Out for Delivery': '#A855F7',
};

// Format peso currency
const formatPeso = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Parse "8:00 AM" to 24h hour number
const parseTimeToHour = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  let [hours] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours;
};

// Format hour to short label e.g. "8 AM"
const formatHourLabel = (hour) => {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

// Status badge class — matches Orders page
const statusClass = (status) => {
  const map = {
    Pending: 'pending',
    Confirmed: 'confirmed',
    Preparing: 'preparing',
    'Out for Delivery': 'out-for-delivery',
    Completed: 'completed',
    Cancelled: 'cancelled',
  };
  return map[status] || '';
};

// Dashboard order ID display: #ORDER-001
const formatDashboardOrderId = (orderId) => {
  const num = orderId.replace(/\D/g, '');
  return `#ORDER-${String(num).padStart(3, '0')}`;
};

// Get Monday of a given week offset from current week
const getWeekStart = (weekOffset) => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Check if order is from today
const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

function Dashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { inventoryItems } = useInventory();

  const [chartMode, setChartMode] = useState('Daily');
  const [fromTime, setFromTime] = useState('8:00 AM');
  const [toTime, setToTime] = useState('8:00 PM');
  const [weekOffset, setWeekOffset] = useState(0);
  const [fromMonth, setFromMonth] = useState(0); // Jan
  const [toMonth, setToMonth] = useState(11); // Dec

  const userName = user?.name || 'Admin';
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Stat card calculations
  const totalSales = useMemo(
    () => orders.filter((o) => o.status === 'Completed').reduce((sum, o) => sum + Number(o.total || 0), 0),
    [orders]
  );
  const newOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Pending').length,
    [orders]
  );

  // Today's orders for donut + list
  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);

  const statusCounts = useMemo(() => {
    const counts = {
      Preparing: 0,
      Pending: 0,
      Completed: 0,
      Cancelled: 0,
      'Out for Delivery': 0,
    };
    todayOrders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [todayOrders]);

  const recentOrders = useMemo(
    () => [...todayOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [todayOrders]
  );

  const lowStockItems = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) return [];

    return inventoryItems
      .filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock')
      .slice(0, 5)
      .map((item) => {
        const safeMax = Math.max(Number(item.reorderPoint) || 0, Number(item.currentStock) || 0, 1);
        const level = item.status === 'Out of Stock' ? 'critical' : 'low';

        return {
          name: item.name,
          qty: Number(item.currentStock) || 0,
          level,
          max: safeMax,
        };
      });
  }, [inventoryItems]);

  // Sales chart data
  const chartData = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'Completed');

    if (chartMode === 'Daily') {
      const fromHour = parseTimeToHour(fromTime);
      const toHour = parseTimeToHour(toTime);
      const slots = [];
      for (let h = fromHour; h < toHour; h++) {
        slots.push({ label: formatHourLabel(h), hour: h, value: 0 });
      }
      const todayCompleted = completedOrders.filter((o) => isToday(o.createdAt));
      todayCompleted.forEach((o) => {
        const hour = new Date(o.createdAt).getHours();
        const slot = slots.find((s) => s.hour === hour);
        if (slot) slot.value += Number(o.total || 0);
      });
      return slots;
    }

    if (chartMode === 'Weekly') {
      const weekStart = getWeekStart(weekOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const slots = DAY_LABELS.map((label, i) => ({
        label,
        dayIndex: i,
        value: 0,
        weekStart,
      }));

      completedOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        if (d >= weekStart && d <= weekEnd) {
          const jsDay = d.getDay();
          const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
          slots[dayIndex].value += Number(o.total || 0);
        }
      });
      return slots;
    }

    // Monthly — filter by selected month range
    const year = new Date().getFullYear();
    const rangeStart = Math.min(fromMonth, toMonth);
    const rangeEnd = Math.max(fromMonth, toMonth);
    const slots = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      slots.push({ label: MONTH_LABELS[i], month: i, value: 0 });
    }
    completedOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year && d.getMonth() >= rangeStart && d.getMonth() <= rangeEnd) {
        const idx = d.getMonth() - rangeStart;
        slots[idx].value += Number(o.total || 0);
      }
    });
    return slots;
  }, [orders, chartMode, fromTime, toTime, weekOffset, fromMonth, toMonth]);

  // Week range label for weekly mode
  const weekRangeLabel = useMemo(() => {
    const start = getWeekStart(weekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [weekOffset]);

  // Donut chart segments
  const donutSegments = useMemo(() => {
    const statuses = ['Preparing', 'Pending', 'Completed', 'Cancelled', 'Out for Delivery'];
    const total = statuses.reduce((sum, s) => sum + statusCounts[s], 0);
    if (total === 0) return { total: 0, segments: [], gradient: 'conic-gradient(#e5e7eb 0deg 360deg)' };

    let cumulative = 0;
    const segments = statuses
      .filter((s) => statusCounts[s] > 0)
      .map((s) => {
        const pct = (statusCounts[s] / total) * 100;
        const start = cumulative;
        cumulative += pct;
        return { status: s, count: statusCounts[s], start, end: cumulative, color: DONUT_COLORS[s] };
      });

    const gradientParts = segments.map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`).join(', ');
    return { total, segments, gradient: `conic-gradient(${gradientParts})` };
  }, [statusCounts]);

  return (
    <div className="dash-page">
      {/* Page Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Hello {userName}, Welcome back!</p>
        </div>
        <button className="dash-bell-btn" aria-label="Notifications">
          <LuBell size={22} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-icon orange">
            <LuShoppingCart size={22} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{formatPeso(totalSales)}</span>
            <span className="dash-stat-label">Total Sales</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon green">
            <LuClipboardList size={22} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{newOrdersCount}</span>
            <span className="dash-stat-label">New Orders</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon blue">
            <LuBike size={22} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">0</span>
            <span className="dash-stat-label">Active Driver</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon purple">
            <LuUsers size={22} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">0</span>
            <span className="dash-stat-label">Low Stock Alert</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Overview + Activity Log */}
      <div className="dash-middle-row">
        {/* Sales Overview */}
        <div className="dash-card dash-chart-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Sales Overview</h2>
            <div className="dash-chart-filters">
              <div className="dash-select-wrapper">
                <select
                  className="dash-select"
                  value={chartMode}
                  onChange={(e) => setChartMode(e.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <LuChevronDown className="dash-select-arrow" size={16} />
              </div>

              {chartMode === 'Daily' && (
                <>
                  <div className="dash-select-wrapper">
                    <select className="dash-select" value={fromTime} onChange={(e) => setFromTime(e.target.value)}>
                      {TIME_OPTIONS.map((t) => (
                        <option key={`from-${t}`} value={t}>From {t}</option>
                      ))}
                    </select>
                    <LuChevronDown className="dash-select-arrow" size={16} />
                  </div>
                  <div className="dash-select-wrapper">
                    <select className="dash-select" value={toTime} onChange={(e) => setToTime(e.target.value)}>
                      {TIME_OPTIONS.map((t) => (
                        <option key={`to-${t}`} value={t}>To {t}</option>
                      ))}
                    </select>
                    <LuChevronDown className="dash-select-arrow" size={16} />
                  </div>
                </>
              )}

              {chartMode === 'Weekly' && (
                <div className="dash-week-nav">
                  <button className="dash-week-btn" onClick={() => setWeekOffset((w) => w - 1)}>
                    <LuChevronLeft size={16} />
                  </button>
                  <span className="dash-week-label">{weekRangeLabel}</span>
                  <button className="dash-week-btn" onClick={() => setWeekOffset((w) => w + 1)}>
                    <LuChevronRight size={16} />
                  </button>
                </div>
              )}

              {chartMode === 'Monthly' && (
                <>
                  <div className="dash-select-wrapper">
                    <select
                      className="dash-select"
                      value={fromMonth}
                      onChange={(e) => setFromMonth(Number(e.target.value))}
                    >
                      {MONTH_LABELS.map((label, i) => (
                        <option key={`from-month-${label}`} value={i}>From {label}</option>
                      ))}
                    </select>
                    <LuChevronDown className="dash-select-arrow" size={16} />
                  </div>
                  <div className="dash-select-wrapper">
                    <select
                      className="dash-select"
                      value={toMonth}
                      onChange={(e) => setToMonth(Number(e.target.value))}
                    >
                      {MONTH_LABELS.map((label, i) => (
                        <option key={`to-month-${label}`} value={i}>To {label}</option>
                      ))}
                    </select>
                    <LuChevronDown className="dash-select-arrow" size={16} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="dash-bar-chart">
            <div className="dash-bar-y-axis">
              {['₱30K', '₱24K', '₱18K', '₱12K', '₱6K', '₱0'].map((label) => (
                <span key={label} className="dash-y-label">{label}</span>
              ))}
            </div>
            <div className="dash-bar-area">
              <div className="dash-bar-grid">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="dash-grid-line" />
                ))}
              </div>
              <div className="dash-bars">
                {chartData.length === 0 ? (
                  <div className="dash-chart-empty">No time slots selected</div>
                ) : (
                  chartData.map((slot, idx) => {
                    const heightPct = CHART_MAX > 0 ? (slot.value / CHART_MAX) * 100 : 0;
                    return (
                      <div key={idx} className="dash-bar-col">
                        <div className="dash-bar-track">
                          <div
                            className="dash-bar-fill"
                            style={{ height: `${Math.min(heightPct, 100)}%` }}
                            title={formatPeso(slot.value)}
                          />
                        </div>
                        <span className="dash-bar-label">{slot.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="dash-card dash-activity-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Activity Log</h2>
            <span className="dash-date-label">{todayDate}</span>
          </div>
          <div className="dash-activity-table-wrap">
            <table className="dash-activity-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_LOG.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.time}</td>
                    <td>{entry.user}</td>
                    <td>{entry.activity}</td>
                    <td>
                      <span className="dash-success-badge">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dash-bottom-row">
        {/* Donut Chart */}
        <div className="dash-card dash-donut-card">
          <h2 className="dash-card-title">Order Status (Today)</h2>
          <div className="dash-donut-content">
            <div className="dash-donut-chart-wrap">
              <div
                className="dash-donut-ring"
                style={{ background: donutSegments.gradient }}
              >
                <div className="dash-donut-hole">
                  <span className="dash-donut-total">{donutSegments.total}</span>
                  <span className="dash-donut-sub">Total Orders</span>
                </div>
              </div>
            </div>
            <div className="dash-donut-legend">
              {Object.entries(DONUT_COLORS).map(([status, color]) => (
                <div key={status} className="dash-legend-item">
                  <span className="dash-legend-dot" style={{ background: color }} />
                  <span className="dash-legend-text">{status}</span>
                  <span className="dash-legend-count">{statusCounts[status]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="dash-card dash-orders-list-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Order Status (Today)</h2>
            <Link to="/supervisor/orders" className="dash-view-all">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="dash-empty-msg">No orders today</div>
          ) : (
            <ul className="dash-orders-list">
              {recentOrders.map((order) => (
                <li key={order.id} className="dash-order-item">
                  <div className="dash-order-left">
                    <span className="dash-order-id">{formatDashboardOrderId(order.orderId)}</span>
                    <span className="dash-order-customer">{order.customerName.split(' ')[0]}</span>
                  </div>
                  <span className={`dash-status-badge ${statusClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="dash-order-total">{formatPeso(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low Stocks Alert */}
        <div className="dash-card dash-stock-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Low Stocks Alert</h2>
            <Link to="/supervisor/inventory" className="dash-view-all">View All</Link>
          </div>
          <ul className="dash-stock-list">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <li key={item.name} className="dash-stock-item">
                  <div className="dash-stock-row">
                    <span className="dash-stock-name">{item.name}</span>
                    <span className={`dash-stock-qty ${item.level}`}>{item.qty}pcs</span>
                  </div>
                  <div className="dash-stock-bar-track">
                    <div
                      className={`dash-stock-bar-fill ${item.level}`}
                      style={{ width: `${Math.min((item.qty / item.max) * 100, 100)}%` }}
                    />
                  </div>
                </li>
              ))
            ) : (
              <li className="dash-stock-empty">All inventory items are above the reorder level.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

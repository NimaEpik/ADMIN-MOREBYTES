import { useState, useEffect, useRef } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useOrders } from '../../context/OrdersContext';
import {
  LuShoppingCart,
  LuCircleCheck,
  LuClock,
  LuBike,
  LuSearch,
  LuRefreshCw,
  LuPlus,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
  LuClipboardList,
  LuX,
  LuMinus,
  LuShoppingBag,
} from 'react-icons/lu';
import './Orders.css';

// Relative time helper
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(date).toLocaleDateString();
};

// Status badge CSS class mapping
const statusClass = (status) => {
  const map = {
    'Pending': 'pending',
    'Confirmed': 'confirmed',
    'Preparing': 'preparing',
    'Out for Delivery': 'out-for-delivery',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
  };
  return map[status] || '';
};

// Date filter helper
const isWithinDateFilter = (date, filter) => {
  const now = new Date();
  const d = new Date(date);
  if (filter === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (filter === 'This Week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }
  if (filter === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

function Orders() {
  // Pull menu items from context for POS modal
  const { menuItems } = useMenu();
  const { orders, orderCounter, addOrder, updateOrderStatus, cancelOrder, formatOrderId } = useOrders();

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 5;

  // Dropdown state for "..." actions
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // POS Modal
  const [isPOSOpen, setIsPOSOpen] = useState(false);

  // View Details Modal
  const [viewingOrder, setViewingOrder] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stat card calculations
  const totalToday = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveryCount = orders.filter((o) => o.status === 'Out for Delivery').length;

  // Combined filter logic
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter !== 'All' && order.status !== statusFilter) return false;
    // Type filter
    if (typeFilter !== 'All' && order.orderType !== typeFilter) return false;
    // Date filter
    if (!isWithinDateFilter(order.createdAt, dateFilter)) return false;
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesId = `#${order.orderId}`.toLowerCase().includes(q) || order.orderId.toLowerCase().includes(q);
      const matchesCustomer = order.customerName.toLowerCase().includes(q);
      if (!matchesId && !matchesCustomer) return false;
    }
    return true;
  });

  // Pagination
  const totalFiltered = filteredOrders.length;
  const totalPages = Math.ceil(totalFiltered / ORDERS_PER_PAGE) || 1;
  const startIdx = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIdx = Math.min(startIdx + ORDERS_PER_PAGE, totalFiltered);
  const paginatedOrders = filteredOrders.slice(startIdx, endIdx);

  // Reset filters
  const handleRefresh = () => {
    setStatusFilter('All');
    setTypeFilter('All');
    setDateFilter('Today');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Status advancement
  const advanceStatus = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  // Cancel order handler
  const handleCancelOrder = (orderId) => {
    cancelOrder(orderId);
    setOpenDropdownId(null);
  };

  // Format items string for table display
  const formatItemsString = (items) => {
    return items.map((i) => {
      const sizeStr = i.size ? ` (${i.size})` : '';
      return `${i.quantity}x ${i.name}${sizeStr}`;
    }).join(', ');
  };

  // Action button based on status
  const renderActionButton = (order) => {
    switch (order.status) {
      case 'Pending':
        return (
          <button className="orders-action-btn" onClick={() => advanceStatus(order.id, 'Confirmed')}>
            Confirm
          </button>
        );
      case 'Confirmed':
        return (
          <button className="orders-action-btn" onClick={() => advanceStatus(order.id, 'Preparing')}>
            Preparing
          </button>
        );
      case 'Preparing':
        if (order.orderType !== 'Online Order') {
          return null;
        }
        return (
          <button className="orders-action-btn" onClick={() => advanceStatus(order.id, 'Out for Delivery')}>
            Assign Rider
          </button>
        );
      default:
        return null;
    }
  };

  const isPreparingOnlineOrder = (order) => order.status === 'Preparing' && order.orderType === 'Online Order';

  // Place order from POS modal
  const handlePlaceOrder = (orderData) => {
    addOrder(orderData);
    setIsPOSOpen(false);
  };

  return (
    <div className="orders-page">
      {/* Page Title */}
      <h1 className="orders-title">Order Management</h1>

      {/* Stat Cards */}
      <div className="orders-stats-row">
        <div className="orders-stat-card">
          <div className="orders-stat-icon orange">
            <LuShoppingCart size={22} />
          </div>
          <div className="orders-stat-info">
            <span className="orders-stat-count">{totalToday}</span>
            <span className="orders-stat-label">Total Orders Today</span>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="orders-stat-icon green">
            <LuCircleCheck size={22} />
          </div>
          <div className="orders-stat-info">
            <span className="orders-stat-count">{completedCount}</span>
            <span className="orders-stat-label">Orders Completed</span>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="orders-stat-icon orange">
            <LuClock size={22} />
          </div>
          <div className="orders-stat-info">
            <span className="orders-stat-count">{pendingCount}</span>
            <span className="orders-stat-label">Pending Orders</span>
          </div>
        </div>
        <div className="orders-stat-card">
          <div className="orders-stat-icon blue">
            <LuBike size={22} />
          </div>
          <div className="orders-stat-info">
            <span className="orders-stat-count">{deliveryCount}</span>
            <span className="orders-stat-label">Out for Delivery</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="orders-filter-bar">
        {/* Status Dropdown */}
        <div className="orders-select-wrapper">
          <select
            className="orders-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <LuChevronDown className="orders-select-arrow" size={16} />
        </div>

        {/* Type Dropdown */}
        <div className="orders-select-wrapper">
          <select
            className="orders-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="All">All Types</option>
            <option value="Online Order">Online Order</option>
            <option value="Takeout">Takeout</option>
            <option value="Dine-in">Dine-in</option>
          </select>
          <LuChevronDown className="orders-select-arrow" size={16} />
        </div>

        {/* Date Dropdown */}
        <div className="orders-select-wrapper">
          <select
            className="orders-select"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
          <LuChevronDown className="orders-select-arrow" size={16} />
        </div>

        {/* Search */}
        <div className="orders-search-wrapper">
          <LuSearch className="orders-search-icon" size={16} />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by ID or Customer"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Create Order */}
        <button className="orders-create-btn" onClick={() => setIsPOSOpen(true)}>
          <LuPlus size={16} />
          <span>Create Order</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="orders-table-card">
        {totalFiltered === 0 ? (
          /* Empty State */
          <div className="orders-empty-state">
            <div className="orders-empty-icon-circle">
              <LuClipboardList size={36} />
            </div>
            <h3 className="orders-empty-title">No orders yet</h3>
            <p className="orders-empty-subtext">
              Orders will appear here once customers place them or you create one
            </p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Order Type</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id}>
                      {/* Order ID */}
                      <td>
                        <div className="orders-id-cell">
                          <span className="orders-id-text">#{order.orderId}</span>
                          <span className="orders-id-time">{getRelativeTime(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>{order.customerName}</td>

                      {/* Order Type */}
                      <td>{order.orderType}</td>

                      {/* Items */}
                      <td>
                        <span className="orders-items-text">{formatItemsString(order.items)}</span>
                      </td>

                      {/* Total */}
                      <td>
                        <span className="orders-total-text">₱{order.total}</span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`orders-status-badge ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="orders-actions-wrapper" ref={openDropdownId === order.id ? dropdownRef : null}>
                          {renderActionButton(order)}

                          {/* ... dots button */}
                          <button
                            className="orders-dots-btn"
                            onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                          >
                            ···
                          </button>

                          {/* Dropdown */}
                          {openDropdownId === order.id && (
                            <div className="orders-dropdown">
                              <button
                                className="orders-dropdown-item"
                                onClick={() => { setViewingOrder(order); setOpenDropdownId(null); }}
                              >
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="orders-pagination-bar">
              <span className="orders-pagination-info">
                Showing {startIdx + 1} to {endIdx} of {totalFiltered} orders
              </span>
              <div className="orders-pagination-controls">
                <button
                  className="orders-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  <LuChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`orders-page-btn ${num === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="orders-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* POS Modal */}
      {isPOSOpen && (
        <POSModal
          menuItems={menuItems}
          nextOrderId={formatOrderId(orderCounter)}
          onPlaceOrder={handlePlaceOrder}
          onClose={() => setIsPOSOpen(false)}
        />
      )}

      {/* View Details Modal */}
      {viewingOrder && (
        <div className="orders-modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="orders-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="orders-details-header">
              <h2>Order #{viewingOrder.orderId}</h2>
              <button className="orders-modal-close" onClick={() => setViewingOrder(null)}>
                <LuX size={20} />
              </button>
            </div>

            <div className="orders-details-row">
              <span className="orders-details-label">Customer</span>
              <span className="orders-details-value">{viewingOrder.customerName}</span>
            </div>
            <div className="orders-details-row">
              <span className="orders-details-label">Order Type</span>
              <span className="orders-details-value">{viewingOrder.orderType}</span>
            </div>
            <div className="orders-details-row">
              <span className="orders-details-label">Status</span>
              <span className="orders-details-value">
                <span className={`orders-status-badge ${statusClass(viewingOrder.status)}`}>
                  {viewingOrder.status}
                </span>
              </span>
            </div>
            <div className="orders-details-row">
              <span className="orders-details-label">Placed</span>
              <span className="orders-details-value">{getRelativeTime(viewingOrder.createdAt)}</span>
            </div>

            <div className="orders-details-items-title">Order Items</div>
            {viewingOrder.items.map((item, idx) => (
              <div key={idx} className="orders-details-item-row">
                <span>{item.quantity}x {item.name}{item.size ? ` (${item.size})` : ''}</span>
                <span>₱{item.quantity * item.price}</span>
              </div>
            ))}

            <div className="orders-details-total-row">
              <span>Order Total</span>
              <span className="orders-details-total-value">₱{viewingOrder.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== POS Modal Component ===== */
function POSModal({ menuItems, nextOrderId, onPlaceOrder, onClose }) {
  // Only show available items
  const availableItems = menuItems.filter(
    (item) => item.status === 'available' && item.availability === true
  );

  // POS category filter
  const categories = ['All', 'Pizza', 'Desserts', 'Snacks', 'Rice Meals', 'Beverages'];
  const [posCategory, setPosCategory] = useState('All');
  const [posPage, setPosPage] = useState(1);
  const POS_ITEMS_PER_PAGE = 6;

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-in');
  const [customerName, setCustomerName] = useState('');
  const [nameError, setNameError] = useState(false);

  // Size selector popup
  const [sizeItem, setSizeItem] = useState(null);

  // Filter menu items by category
  const filteredPosItems = availableItems.filter((item) => {
    if (posCategory === 'All') return true;
    return item.category === posCategory;
  });

  // POS pagination
  const totalPosPages = Math.ceil(filteredPosItems.length / POS_ITEMS_PER_PAGE) || 1;
  const posStart = (posPage - 1) * POS_ITEMS_PER_PAGE;
  const posEnd = Math.min(posStart + POS_ITEMS_PER_PAGE, filteredPosItems.length);
  const paginatedPosItems = filteredPosItems.slice(posStart, posEnd);

  // Reset page when category changes
  const handleCategoryChange = (cat) => {
    setPosCategory(cat);
    setPosPage(1);
  };

  // Add item to cart
  const addToCart = (item, size = null, price = null) => {
    const cartKey = `${item.id}-${size || 'default'}`;
    const unitPrice = price || item.price || 0;

    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        // Increment quantity
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      // Add new cart entry
      return [...prev, {
        cartKey,
        itemId: item.id,
        name: item.name,
        size,
        price: unitPrice,
        quantity: 1,
      }];
    });
    setSizeItem(null);
  };

  // Handle item click
  const handleItemClick = (item) => {
    if (item.hasSizes && item.sizes && item.sizes.length > 0) {
      // Show size selector
      setSizeItem(item);
    } else {
      // Add directly
      addToCart(item);
    }
  };

  // Cart quantity controls
  const updateQty = (cartKey, delta) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartKey === cartKey) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      }).filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const total = subtotal;

  // Price display helper for POS items
  const renderPosPrice = (item) => {
    if (item.hasSizes && item.sizes && item.sizes.length > 0) {
      const prices = item.sizes.map((s) => parseFloat(s.price) || 0).filter((p) => p > 0);
      if (prices.length > 1) {
        return `₱${Math.min(...prices)} - ₱${Math.max(...prices)}`;
      } else if (prices.length === 1) {
        return `₱${prices[0]}`;
      }
    }
    return `₱${item.price || 0}`;
  };

  // Place order handler
  const handlePlace = () => {
    // Validate
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    if (cart.length === 0) {
      alert('Please add at least one item to the cart.');
      return;
    }

    onPlaceOrder({
      customerName: customerName.trim(),
      orderType,
      items: cart.map((c) => ({
        name: c.name,
        size: c.size,
        quantity: c.quantity,
        price: c.price,
      })),
      total,
    });
  };

  return (
    <div className="orders-modal-overlay" onClick={onClose}>
      <div className="orders-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="orders-modal-header">
          <h2>Create New Order — #{nextOrderId}</h2>
          <button className="orders-modal-close" onClick={onClose}>
            <LuX size={20} />
          </button>
        </div>

        {/* Two-panel body */}
        <div className="orders-modal-body">
          {/* LEFT: Menu Items */}
          <div className="orders-modal-left">
            <div className="orders-modal-left-header">
              <h3>Select Items from Menu</h3>
            </div>

            {/* Category Tabs */}
            <div className="orders-pos-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`orders-pos-cat-btn ${posCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="orders-pos-grid">
              {paginatedPosItems.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  No items available in this category
                </div>
              ) : (
                paginatedPosItems.map((item) => (
                  <div
                    key={item.id}
                    className="orders-pos-item-card"
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="orders-pos-item-name">{item.name}</span>
                    <span className="orders-pos-item-price">{renderPosPrice(item)}</span>
                  </div>
                ))
              )}
            </div>

            {/* POS Pagination */}
            {totalPosPages > 1 && (
              <div className="orders-pos-pagination">
                <button
                  className="orders-pos-page-btn"
                  disabled={posPage === 1}
                  onClick={() => setPosPage((p) => p - 1)}
                >
                  <LuChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPosPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`orders-pos-page-btn ${num === posPage ? 'active' : ''}`}
                    onClick={() => setPosPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="orders-pos-page-btn"
                  disabled={posPage === totalPosPages}
                  onClick={() => setPosPage((p) => p + 1)}
                >
                  <LuChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Cart & Details */}
          <div className="orders-modal-right">
            <div className="orders-modal-right-header">
              <h3>Customer & Details</h3>
            </div>

            {/* Order Type */}
            <div className="orders-pos-field">
              <label>Order Type</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="Dine-in">Dine-in</option>
                <option value="Takeout">Takeout</option>
                <option value="Online Order">Online Order</option>
              </select>
            </div>

            {/* Customer Name */}
            <div className="orders-pos-field">
              <label>Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Sean Benny"
                value={customerName}
                className={nameError && !customerName.trim() ? 'error' : ''}
                onChange={(e) => { setCustomerName(e.target.value); setNameError(false); }}
              />
              {nameError && !customerName.trim() && (
                <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '2px' }}>
                  Customer name is required
                </span>
              )}
            </div>

            {/* Cart */}
            <div className="orders-cart-area">
              {cart.length === 0 ? (
                <div className="orders-cart-empty">
                  <div className="orders-cart-empty-icon">
                    <LuShoppingBag size={22} />
                  </div>
                  <p>No items yet...<br />Select items from the menu</p>
                </div>
              ) : (
                cart.map((c) => (
                  <div key={c.cartKey} className="orders-cart-item">
                    <div className="orders-cart-item-info">
                      <div className="orders-cart-item-name">
                        {c.name}{c.size ? ` (${c.size})` : ''}
                      </div>
                      <div className="orders-cart-item-price">₱{c.price * c.quantity}</div>
                    </div>
                    <div className="orders-qty-controls">
                      <button className="orders-qty-btn" onClick={() => updateQty(c.cartKey, -1)}>
                        <LuMinus size={12} />
                      </button>
                      <span className="orders-qty-value">{c.quantity}</span>
                      <button className="orders-qty-btn" onClick={() => updateQty(c.cartKey, 1)}>
                        <LuPlus size={12} />
                      </button>
                    </div>
                    <button className="orders-cart-remove" onClick={() => removeFromCart(c.cartKey)}>
                      <LuX size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Totals */}
            {cart.length > 0 && (
              <div className="orders-cart-totals">
                <div className="orders-cart-subtotal">
                  <span>Subtotal</span>
                  <span>₱{subtotal}</span>
                </div>
                <div className="orders-cart-total">
                  <span className="orders-cart-total-label">Order Total</span>
                  <span className="orders-cart-total-value">₱{total}</span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="orders-modal-footer">
              <button className="orders-modal-btn cancel" onClick={onClose}>Cancel</button>
              <button className="orders-modal-btn place" onClick={handlePlace}>Place Order</button>
            </div>
          </div>
        </div>
      </div>

      {/* Size Selector Popup */}
      {sizeItem && (
        <div className="orders-size-popup-overlay" onClick={(e) => { e.stopPropagation(); setSizeItem(null); }}>
          <div className="orders-size-popup" onClick={(e) => e.stopPropagation()}>
            <h4>Select Size — {sizeItem.name}</h4>
            {sizeItem.sizes.map((s, idx) => (
              <div
                key={idx}
                className="orders-size-option"
                onClick={() => addToCart(sizeItem, s.name, parseFloat(s.price) || 0)}
              >
                <span className="orders-size-option-name">{s.name}</span>
                <span className="orders-size-option-price">₱{s.price}</span>
              </div>
            ))}
            <button className="orders-size-popup-cancel" onClick={() => setSizeItem(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;

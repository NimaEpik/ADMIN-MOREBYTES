import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  LuSearch,
  LuPlus,
  LuRotateCcw,
  LuPencil,
  LuClock,
  LuBox,
  LuTriangleAlert,
  LuCircleCheck,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
  LuX,
} from 'react-icons/lu';
import './Inventory.css';

// Format timestamp into relative time string
const getRelativeTime = (isoString) => {
  if (!isoString) return 'N/A';
  const now = new Date();
  const past = new Date(isoString);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

// Format timestamp into standard date-time format for logs
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

function Inventory() {
  const {
    inventoryItems = [],
    activityLogs = [],
    addItem,
    restockItem,
    editItem,
  } = useInventory() || {};

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Visibility State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Selected Item for Modals
  const [selectedItem, setSelectedItem] = useState(null);

  // Modal Form State
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'Pizza',
    currentStock: '',
    reorderPoint: '',
  });
  const [restockQuantity, setRestockQuantity] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'Pizza',
    currentStock: '',
    reorderPoint: '',
  });

  // Stock History Filters State
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('All Categories');
  const [historyAction, setHistoryAction] = useState('All');
  const [historyTime, setHistoryTime] = useState('All Time');
  const [historyPage, setHistoryPage] = useState(1);

  // Form Validation Errors
  const [formError, setFormError] = useState('');

  // Calculate Stat Cards Metrics
  const totalStockItems = inventoryItems.length;

  // Calculate items added this week (within last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const addedThisWeekCount = inventoryItems.filter(
    (item) => new Date(item.createdAt || item.lastUpdated) >= oneWeekAgo
  ).length;

  // Count low stock & out of stock items
  const lowStockAlertsCount = inventoryItems.filter(
    (item) => item.status === 'Low Stock' || item.status === 'Out of Stock'
  ).length;

  const sufficientItemsCount = inventoryItems.filter(
    (item) => item.status === 'Sufficient'
  ).length;

  // Filter main inventory items table
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'All Status' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Table Pagination
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showingStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);

  // Handle Add Stock Form Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || addForm.currentStock === '' || addForm.reorderPoint === '') {
      setFormError('Please fill out all required fields.');
      return;
    }
    addItem({
      name: addForm.name,
      category: addForm.category,
      currentStock: Number(addForm.currentStock),
      reorderPoint: Number(addForm.reorderPoint),
    });
    setAddForm({ name: '', category: 'Pizza', currentStock: '', reorderPoint: '' });
    setFormError('');
    setIsAddModalOpen(false);
  };

  // Handle Open Restock Modal
  const openRestockModal = (item) => {
    setSelectedItem(item);
    setRestockQuantity('');
    setFormError('');
    setIsRestockModalOpen(true);
  };

  // Handle Submit Restock
  const handleRestockSubmit = (e) => {
    e.preventDefault();
    const qty = Number(restockQuantity);
    if (!restockQuantity || isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid stock quantity.');
      return;
    }
    restockItem(selectedItem.id, qty);
    setFormError('');
    setIsRestockModalOpen(false);
  };

  // Handle Open Edit Modal
  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Handle Submit Edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.currentStock === '' || editForm.reorderPoint === '') {
      setFormError('Please fill out all required fields.');
      return;
    }
    editItem(selectedItem.id, {
      name: editForm.name,
      category: editForm.category,
      currentStock: Number(editForm.currentStock),
      reorderPoint: Number(editForm.reorderPoint),
    });
    setFormError('');
    setIsEditModalOpen(false);
  };

  // Filter History Activity Logs
  const filteredHistoryLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.itemName.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.reason.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(historySearch.toLowerCase());

    const matchesCategory =
      historyCategory === 'All Categories' || log.category === historyCategory;

    const matchesAction =
      historyAction === 'All' || log.action === historyAction;

    let matchesTime = true;
    const logDate = new Date(log.date);
    const now = new Date();

    if (historyTime === 'Today') {
      matchesTime = logDate.toDateString() === now.toDateString();
    } else if (historyTime === 'This Week') {
      const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);
      matchesTime = logDate >= weekAgo;
    } else if (historyTime === 'This Month') {
      matchesTime =
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesAction && matchesTime;
  });

  // History Pagination
  const LOGS_PER_PAGE = 7;
  const historyTotalPages = Math.ceil(filteredHistoryLogs.length / LOGS_PER_PAGE) || 1;
  const paginatedLogs = filteredHistoryLogs.slice(
    (historyPage - 1) * LOGS_PER_PAGE,
    historyPage * LOGS_PER_PAGE
  );

  const historyShowingStart = filteredHistoryLogs.length === 0 ? 0 : (historyPage - 1) * LOGS_PER_PAGE + 1;
  const historyShowingEnd = Math.min(historyPage * LOGS_PER_PAGE, filteredHistoryLogs.length);

  return (
    <div className="inventory-page">
      {/* Top Header Section */}
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">Inventory Stock</h1>
        </div>
        <div className="inventory-top-actions">
          <button
            className="btn btn-outline-history"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <LuClock className="btn-icon" /> Stock History
          </button>
          <button
            className="btn btn-primary-add"
            onClick={() => {
              setFormError('');
              setAddForm({ name: '', category: 'Pizza', currentStock: '', reorderPoint: '' });
              setIsAddModalOpen(true);
            }}
          >
            <LuPlus className="btn-icon" /> Add Stock
          </button>
        </div>
      </div>

      {/* 3 Stat Cards Top Row */}
      <div className="inventory-stats-grid">
        {/* Stat Card 1: Total Stock Items */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <span className="stat-card-title">Total Stock Items</span>
              <div className="stat-card-value orange-text">{totalStockItems}</div>
            </div>
            <div className="stat-icon-wrapper orange-bg">
              <LuBox className="stat-icon orange-icon" />
            </div>
          </div>
          <div className="stat-card-footer green-text">
            +{addedThisWeekCount} added this week
          </div>
        </div>

        {/* Stat Card 2: Low Stock Alerts */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <span className="stat-card-title">Low Stock Alerts</span>
              <div className="stat-card-value red-text">{lowStockAlertsCount}</div>
            </div>
            <div className="stat-icon-wrapper red-bg">
              <LuTriangleAlert className="stat-icon red-icon" />
            </div>
          </div>
          <div className="stat-card-footer red-text">
            Requires Immediate Attention
          </div>
        </div>

        {/* Stat Card 3: Sufficient Items */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <span className="stat-card-title">Sufficient Items</span>
              <div className="stat-card-value green-text">{sufficientItemsCount}</div>
            </div>
            <div className="stat-icon-wrapper green-bg">
              <LuCircleCheck className="stat-icon green-icon" />
            </div>
          </div>
          <div className="stat-card-footer green-text">
            Stock levels are Healthy
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="inventory-filter-bar">
        <div className="search-input-wrapper">
          <LuSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search name, categories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="select-dropdown-wrapper">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All Categories">All Categories</option>
            <option value="Pizza">Pizza</option>
            <option value="Snack">Snack</option>
            <option value="Desserts">Desserts</option>
            <option value="Beverages">Beverages</option>
            <option value="Rice Meals">Rice Meals</option>
          </select>
          <LuChevronDown className="select-chevron-icon" />
        </div>

        <div className="select-dropdown-wrapper">
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All Status">All Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Sufficient">Sufficient</option>
          </select>
          <LuChevronDown className="select-chevron-icon" />
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="table-card">
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="empty-state-container">
            <div className="empty-state-icon-box">
              <LuBox className="empty-state-icon" />
            </div>
            <h3 className="empty-state-title">No inventory items yet</h3>
            <p className="empty-state-subtext">Click '+ Add Stock' to add your first item</p>
          </div>
        ) : (
          /* Items Table */
          <div className="table-responsive">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reorder Point</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isLowOrOut = item.status === 'Out of Stock' || item.status === 'Low Stock';

                  return (
                    <tr key={item.id}>
                      {/* Name - bold, no image */}
                      <td className="font-bold text-dark">{item.name}</td>

                      {/* Category - text, gray color */}
                      <td className="text-gray">{item.category}</td>

                      {/* Current Stock - colored red if out/low, normal if sufficient */}
                      <td className={isLowOrOut ? 'stock-colored-red' : 'stock-colored-normal'}>
                        {item.currentStock} pcs
                      </td>

                      {/* Reorder Point */}
                      <td className="text-dark">{item.reorderPoint} pcs</td>

                      {/* Last Updated - relative time */}
                      <td className="text-gray">{getRelativeTime(item.lastUpdated)}</td>

                      {/* Status badge */}
                      <td>
                        <span className={`status-badge badge-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions - Restock & Edit icon buttons (NO hard delete button!) */}
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            className="action-btn restock-btn"
                            title="Restock Item"
                            onClick={() => openRestockModal(item)}
                          >
                            <LuRotateCcw />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            title="Edit Item"
                            onClick={() => openEditModal(item)}
                          >
                            <LuPencil />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {filteredItems.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-info">
              Showing {showingStart} to {showingEnd} of {filteredItems.length} items
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <LuChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-number-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <LuChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD STOCK MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Add new stock item</h2>
                <p className="modal-subtitle">Add a new item to inventory</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <LuX />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error-alert">{formError}</div>}

                {/* Section 1: Item Information */}
                <div className="form-section">
                  <h4 className="form-section-title">Item Information</h4>
                  <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Frozen Fries"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="select-dropdown-wrapper">
                      <select
                        className="form-select"
                        value={addForm.category}
                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      >
                        <option value="Pizza">Pizza</option>
                        <option value="Snack">Snack</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Rice Meals">Rice Meals</option>
                      </select>
                      <LuChevronDown className="select-chevron-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        value={addForm.currentStock}
                        onChange={(e) => setAddForm({ ...addForm, currentStock: e.target.value })}
                      />
                      <span className="unit-label">pcs</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Stock Threshold */}
                <div className="form-section">
                  <h4 className="form-section-title">Stock Threshold</h4>
                  <div className="form-group">
                    <label className="form-label">Reorder Point</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="e.g. 10"
                        value={addForm.reorderPoint}
                        onChange={(e) => setAddForm({ ...addForm, reorderPoint: e.target.value })}
                      />
                      <span className="unit-label">pcs</span>
                    </div>
                    <small className="form-helper-text">
                      System will alert when stock falls below this number
                    </small>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel-red"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-orange-submit">
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESTOCK MODAL */}
      {/* ========================================================================= */}
      {isRestockModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container modal-sm">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Restock {selectedItem.name}</h2>
                <p className="modal-subtitle">Current Stock: {selectedItem.currentStock} pcs</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRestockModalOpen(false)}>
                <LuX />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error-alert">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Add Quantity</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="0"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(e.target.value)}
                      autoFocus
                    />
                    <span className="unit-label">pcs</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel-gray"
                  onClick={() => setIsRestockModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-orange-submit">
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Stock Item</h2>
                <p className="modal-subtitle">Update item inventory details</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <LuX />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error-alert">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div className="select-dropdown-wrapper">
                    <select
                      className="form-select"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="Pizza">Pizza</option>
                      <option value="Snack">Snack</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Rice Meals">Rice Meals</option>
                    </select>
                    <LuChevronDown className="select-chevron-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editForm.currentStock}
                      onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                    />
                    <span className="unit-label">pcs</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editForm.reorderPoint}
                      onChange={(e) => setEditForm({ ...editForm, reorderPoint: e.target.value })}
                    />
                    <span className="unit-label">pcs</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel-gray"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-orange-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: STOCK HISTORY MODAL */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Inventory Activity Log</h2>
                <p className="modal-subtitle">View and track all inventory movements and changes</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                <LuX />
              </button>
            </div>

            <div className="modal-body">
              {/* History Filter Bar */}
              <div className="history-filter-bar">
                <div className="search-input-wrapper">
                  <LuSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search item, reason..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                  />
                </div>

                <div className="select-dropdown-wrapper">
                  <select
                    className="filter-select"
                    value={historyCategory}
                    onChange={(e) => {
                      setHistoryCategory(e.target.value);
                      setHistoryPage(1);
                    }}
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Snack">Snack</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Rice Meals">Rice Meals</option>
                  </select>
                  <LuChevronDown className="select-chevron-icon" />
                </div>

                <div className="select-dropdown-wrapper">
                  <select
                    className="filter-select"
                    value={historyAction}
                    onChange={(e) => {
                      setHistoryAction(e.target.value);
                      setHistoryPage(1);
                    }}
                  >
                    <option value="All">All Activities</option>
                    <option value="New Stock">New Stock</option>
                    <option value="Restocked">Restocked</option>
                    <option value="Stock Deducted">Stock Deducted</option>
                    <option value="Manual Adjustment">Manual Adjustment</option>
                  </select>
                  <LuChevronDown className="select-chevron-icon" />
                </div>

                <div className="select-dropdown-wrapper">
                  <select
                    className="filter-select"
                    value={historyTime}
                    onChange={(e) => {
                      setHistoryTime(e.target.value);
                      setHistoryPage(1);
                    }}
                  >
                    <option value="All Time">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                  <LuChevronDown className="select-chevron-icon" />
                </div>
              </div>

              {/* History Table */}
              <div className="history-table-wrapper">
                {filteredHistoryLogs.length === 0 ? (
                  <div className="empty-history-message">
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Item Name</th>
                        <th>Action</th>
                        <th>Quantity</th>
                        <th>New Stock</th>
                        <th>Reason</th>
                        <th>Performed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => {
                        let actionClass = 'action-manual';
                        // New Stock and Restocked should use the restock style
                        if (log.action === 'New Stock' || log.action === 'Restocked') actionClass = 'action-restock';
                        if (log.action === 'Stock Deducted') actionClass = 'action-deducted';

                        let qtyClass = 'qty-neutral';
                        if (log.quantity?.startsWith('+')) qtyClass = 'qty-positive';
                        if (log.quantity?.startsWith('-')) qtyClass = 'qty-negative';

                        return (
                          <tr key={log.id}>
                            <td className="text-gray font-sm">{formatDateTime(log.date)}</td>
                            <td className="font-bold text-dark">{log.itemName}</td>
                            <td>
                              <span className={`action-badge ${actionClass}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className={`font-bold ${qtyClass}`}>{log.quantity}</td>
                            <td className="text-dark">{log.newStock}</td>
                            <td className="text-gray">{log.reason}</td>
                            <td className="text-dark font-sm">{log.performedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* History Pagination */}
              {filteredHistoryLogs.length > 0 && (
                <div className="table-pagination-footer">
                  <div className="pagination-info">
                    Showing {historyShowingStart} to {historyShowingEnd} of {filteredHistoryLogs.length} activities
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    >
                      <LuChevronLeft />
                    </button>
                    {Array.from({ length: historyTotalPages }, (_, idx) => idx + 1).map((page) => (
                      <button
                        key={page}
                        className={`pagination-number-btn ${historyPage === page ? 'active' : ''}`}
                        onClick={() => setHistoryPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      disabled={historyPage === historyTotalPages}
                      onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                    >
                      <LuChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;

import { useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { 
  LuSearch, 
  LuPlus, 
  LuPencil, 
  LuArchive, 
  LuRotateCcw, 
  LuTrash2, 
  LuUtensils, 
  LuChevronLeft, 
  LuChevronRight,
  LuX,
  LuImage,
  LuChevronDown
} from 'react-icons/lu';
import './Menu.css';

// Default food placeholders if no image is uploaded
const DEFAULT_IMAGE_PLACEHOLDER = '';

function Menu() {
  // Pull global menu state from context instead of local useState
  const { menuItems, addItem, updateItem, archiveItem, restoreItem, toggleAvailability } = useMenu();

  // Tab & Filters state
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Modal visibility states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItemId, setEditingItemId] = useState(null);

  // Confirmation Modals
  const [archivingItem, setArchivingItem] = useState(null);
  const [restoringItem, setRestoringItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Pizza',
    price: '',
    hasSizes: false,
    sizes: [
      { name: 'Medium', price: '' },
      { name: 'Large', price: '' },
    ],
    image: '',
  });

  // Calculate Tab Counts — uses menuItems from context
  const activeCount = menuItems.filter((i) => i.status === 'available').length;
  const archivedCount = menuItems.filter((i) => i.status === 'archived').length;
  const allCount = menuItems.length;

  // Filter Items according to Active Tab, Category, and Search Query
  const filteredItems = menuItems.filter((item) => {
    // 1. Tab Status Filter
    if (activeTab === 'active' && item.status !== 'available') return false;
    if (activeTab === 'archived' && item.status !== 'archived') return false;

    // 2. Category Filter
    if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
      return false;
    }

    // 3. Search Query Filter (Item Name)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query)) return false;
    }

    return true;
  });

  // Pagination Logic
  const totalFilteredItems = filteredItems.length;
  const totalPages = Math.ceil(totalFilteredItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalFilteredItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Handle Availability Toggle — delegates to context
  const handleToggleAvailability = (id) => {
    toggleAvailability(id);
  };

  // Archive Item Actions — delegates to context
  const handleOpenArchiveModal = (item) => {
    setArchivingItem(item);
  };

  const handleConfirmArchive = () => {
    if (!archivingItem) return;
    archiveItem(archivingItem.id);
    setArchivingItem(null);
  };

  // Restore Item Actions — delegates to context
  const handleOpenRestoreModal = (item) => {
    setRestoringItem(item);
  };

  const handleConfirmRestore = () => {
    if (!restoringItem) return;
    restoreItem(restoringItem.id);
    setRestoringItem(null);
  };

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItemId(null);
    setFormData({
      name: '',
      description: '',
      category: 'Pizza',
      price: '',
      hasSizes: false,
      sizes: [
        { name: 'Medium', price: '' },
        { name: 'Large', price: '' },
      ],
      image: '',
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setEditingItemId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Pizza',
      price: item.price !== undefined ? item.price : '',
      hasSizes: item.hasSizes || false,
      sizes: item.sizes && item.sizes.length > 0
        ? item.sizes.map((s) => ({ name: s.name, price: s.price }))
        : [
            { name: 'Medium', price: '' },
            { name: 'Large', price: '' },
          ],
      image: item.image || '',
    });
    setIsItemModalOpen(true);
  };

  // Dynamic Size Handlers
  const handleAddSizeRow = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { name: '', price: '' }],
    }));
  };

  const handleRemoveSizeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSizeChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.sizes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sizes: updated };
    });
  };

  // Handle Image File Upload
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Item (Add or Edit) — delegates to context
  const handleSaveItem = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    let computedPrice = parseFloat(formData.price) || 0;
    let computedMaxPrice = null;
    let validSizes = [];

    if (formData.hasSizes) {
      validSizes = formData.sizes.filter((s) => s.name.trim() !== '');
      const prices = validSizes.map((s) => parseFloat(s.price) || 0).filter((p) => p > 0);
      if (prices.length > 0) {
        computedPrice = Math.min(...prices);
        computedMaxPrice = Math.max(...prices);
      }
    }

    if (modalMode === 'add') {
      // Build new item and pass to context — id is auto-generated in addItem
      const newItem = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: computedPrice,
        maxPrice: computedMaxPrice,
        hasSizes: formData.hasSizes,
        sizes: validSizes,
        status: 'available',
        availability: true,
        image: formData.image || DEFAULT_IMAGE_PLACEHOLDER,
      };
      addItem(newItem);
    } else {
      // Build updated fields and pass to context
      const updatedFields = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: computedPrice,
        maxPrice: computedMaxPrice,
        hasSizes: formData.hasSizes,
        sizes: validSizes,
        image: formData.image || undefined,
      };
      updateItem(editingItemId, updatedFields);
    }

    setIsItemModalOpen(false);
  };

  // Price Display Helper
  const renderPrice = (item) => {
    if (item.hasSizes && item.sizes && item.sizes.length > 0) {
      const prices = item.sizes.map((s) => parseFloat(s.price) || 0).filter((p) => p > 0);
      if (prices.length > 1) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `₱${min} - ₱${max}`;
      } else if (prices.length === 1) {
        return `₱${prices[0]}`;
      }
    }
    return `₱${item.price || 0}`;
  };

  return (
    <div className="menu-page">
      {/* Page Title */}
      <h1 className="menu-title">Menu Management</h1>

      {/* Top Controls Row */}
      <div className="menu-top-row">
        {/* Search Input */}
        <div className="menu-search-wrapper">
          <LuSearch className="menu-search-icon" size={18} />
          <input
            type="text"
            className="menu-search-input"
            placeholder="Search menu items by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Category Dropdown Filter */}
        <div className="menu-category-wrapper">
          <select
            className="menu-category-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All Categories">All Categories</option>
            <option value="Pizza">Pizza</option>
            <option value="Desserts">Desserts</option>
            <option value="Snacks">Snacks</option>
            <option value="Rice Meals">Rice Meals</option>
            <option value="Beverages">Beverages</option>
          </select>
          <LuChevronDown className="menu-select-arrow" size={18} />
        </div>

        {/* Add New Item Button */}
        <button className="menu-add-btn" onClick={handleOpenAddModal}>
          <LuPlus size={18} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="menu-tabs-row">
        <button
          className={`menu-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          <span>Active Items</span>
          <span className="menu-tab-badge">{activeCount}</span>
        </button>

        <button
          className={`menu-tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => handleTabChange('archived')}
        >
          <span>Archived</span>
          <span className="menu-tab-badge">{archivedCount}</span>
        </button>

        <button
          className={`menu-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <span>All Items</span>
          <span className="menu-tab-badge">{allCount}</span>
        </button>
      </div>

      {/* Main Table Card Container */}
      <div className="menu-table-card">
        {totalFilteredItems === 0 ? (
          /* Initial / Filtered Empty State */
          <div className="menu-empty-state">
            <div className="menu-empty-icon-circle">
              <LuUtensils size={36} />
            </div>
            <h3 className="menu-empty-title">No menu items yet</h3>
            <p className="menu-empty-subtext">Click '+ Add New Item' to get started</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="menu-table-wrapper">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Image</th>
                    <th style={{ width: '28%' }}>Item Name</th>
                    <th style={{ width: '15%' }}>Category</th>
                    <th style={{ width: '16%' }}>Price</th>
                    <th style={{ width: '20%' }}>Size Options</th>
                    <th style={{ width: '11%', textAlign: 'center' }}>Availability</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      {/* Image Thumbnail */}
                      <td>
                        <div className="menu-img-container">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="menu-img" />
                          ) : (
                            <div className="menu-img-fallback">
                              <LuUtensils size={20} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Item Name & Description */}
                      <td>
                        <div className="menu-item-info">
                          <span className="menu-item-name">{item.name}</span>
                          {item.description && (
                            <span className="menu-item-desc">{item.description}</span>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className="menu-category-badge">{item.category}</span>
                      </td>

                      {/* Price / Price Range */}
                      <td>
                        <span className="menu-price-text">{renderPrice(item)}</span>
                      </td>

                      {/* Size Options Pills */}
                      <td>
                        <div className="menu-sizes-container">
                          {item.hasSizes && item.sizes && item.sizes.length > 0 ? (
                            item.sizes.map((size, idx) => (
                              <span key={idx} className="menu-size-pill">
                                {size.name}
                              </span>
                            ))
                          ) : (
                            <span className="menu-no-sizes">—</span>
                          )}
                        </div>
                      </td>

                      {/* Availability Toggle — uses context field */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`menu-toggle-switch ${item.availability ? 'on' : 'off'}`}
                          onClick={() => handleToggleAvailability(item.id)}
                          aria-label="Toggle availability"
                        >
                          <span className="menu-toggle-knob" />
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <div className="menu-actions-wrapper">
                          {/* Edit Pencil Icon */}
                          <button
                            type="button"
                            className="menu-action-btn edit"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Item"
                          >
                            <LuPencil size={16} />
                          </button>

                          {/* Archive or Restore Icon */}
                          {item.status === 'archived' ? (
                            <button
                              type="button"
                              className="menu-action-btn restore"
                              onClick={() => handleOpenRestoreModal(item)}
                              title="Restore Item"
                            >
                              <LuRotateCcw size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="menu-action-btn archive"
                              onClick={() => handleOpenArchiveModal(item)}
                              title="Archive Item"
                            >
                              <LuArchive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Bar */}
            <div className="menu-pagination-bar">
              <span className="menu-pagination-info">
                Showing {startIndex + 1}-{endIndex} of {totalFilteredItems} items
              </span>

              <div className="menu-pagination-controls">
                {/* Prev Button */}
                <button
                  className="menu-page-btn arrow"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <LuChevronLeft size={16} />
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`menu-page-btn ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  className="menu-page-btn arrow"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal 1: Add / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="menu-modal-overlay" onClick={() => setIsItemModalOpen(false)}>
          <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-header">
              <h2>{modalMode === 'add' ? 'Add New Item' : 'Edit Menu Item'}</h2>
              <button
                type="button"
                className="menu-modal-close"
                onClick={() => setIsItemModalOpen(false)}
              >
                <LuX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="menu-form">
              {/* Image Upload Field */}
              <div className="menu-form-group">
                <label>Item Image</label>
                <div className="menu-image-upload-box">
                  {formData.image ? (
                    <div className="menu-image-preview-wrap">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="menu-image-preview"
                      />
                      <button
                        type="button"
                        className="menu-image-remove"
                        onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                      >
                        <LuX size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="menu-image-dropzone">
                      <LuImage size={32} />
                      <span>Upload Image or Drop File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Item Name */}
              <div className="menu-form-group">
                <label htmlFor="name">Item Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Full House Pizza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="menu-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description of the item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="menu-form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Pizza">Pizza</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Rice Meals">Rice Meals</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>

              {/* Has Sizes Toggle Switch */}
              <div className="menu-form-group-toggle">
                <span>This item has size options</span>
                <button
                  type="button"
                  className={`menu-form-switch ${formData.hasSizes ? 'on' : 'off'}`}
                  onClick={() => setFormData((prev) => ({ ...prev, hasSizes: !prev.hasSizes }))}
                >
                  <span className="menu-form-switch-knob" />
                </button>
              </div>

              {/* Price field (Hidden if hasSizes is ON) */}
              {!formData.hasSizes ? (
                <div className="menu-form-group">
                  <label htmlFor="price">Price (₱) *</label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 185"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              ) : (
                /* Dynamic Size Options Section */
                <div className="menu-sizes-section">
                  <label>Size Options & Prices</label>
                  <div className="menu-sizes-list">
                    {formData.sizes.map((sizeRow, idx) => (
                      <div key={idx} className="menu-size-input-row">
                        <input
                          type="text"
                          placeholder="Size (e.g. Medium)"
                          value={sizeRow.name}
                          onChange={(e) => handleSizeChange(idx, 'name', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price (₱)"
                          value={sizeRow.price}
                          onChange={(e) => handleSizeChange(idx, 'price', e.target.value)}
                        />
                        {formData.sizes.length > 1 && (
                          <button
                            type="button"
                            className="menu-remove-size-btn"
                            onClick={() => handleRemoveSizeRow(idx)}
                            title="Remove Size"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="menu-add-size-row-btn"
                    onClick={handleAddSizeRow}
                  >
                    <LuPlus size={16} />
                    <span>Add Size</span>
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="menu-modal-footer">
                <button
                  type="button"
                  className="menu-modal-btn cancel"
                  onClick={() => setIsItemModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="menu-modal-btn save">
                  {modalMode === 'add' ? 'Save Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Archive Modal */}
      {archivingItem && (
        <div className="menu-modal-overlay" onClick={() => setArchivingItem(null)}>
          <div className="menu-modal-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="menu-confirm-icon-wrap archive">
              <LuArchive size={28} />
            </div>
            <h3 className="menu-confirm-title">
              Are you sure you want to archive "{archivingItem.name}"?
            </h3>
            <p className="menu-confirm-subtext">
              This item will be moved to the Archived tab. You can restore it anytime later.
            </p>
            <div className="menu-confirm-actions">
              <button
                type="button"
                className="menu-modal-btn cancel"
                onClick={() => setArchivingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-modal-btn confirm-archive"
                onClick={handleConfirmArchive}
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Restore Modal */}
      {restoringItem && (
        <div className="menu-modal-overlay" onClick={() => setRestoringItem(null)}>
          <div className="menu-modal-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="menu-confirm-icon-wrap restore">
              <LuRotateCcw size={28} />
            </div>
            <h3 className="menu-confirm-title">Restore "{restoringItem.name}"?</h3>
            <p className="menu-confirm-subtext">
              This item will return to Active Items and All Items tabs.
            </p>
            <div className="menu-confirm-actions">
              <button
                type="button"
                className="menu-modal-btn cancel"
                onClick={() => setRestoringItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-modal-btn confirm-restore"
                onClick={handleConfirmRestore}
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;

import { useState } from 'react';
import { useDriver } from '../../context/DriverContext';
import {
  LuSearch,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuUser,
  LuPhone,
  LuMail,
  LuBike,
  LuIdCard,
  LuStar,
  LuPencil,
  LuX,
  LuCalendar,
} from 'react-icons/lu';
import './Driver.css';

// Sample Driver Data used only when user clicks "Load Sample Drivers"
const SAMPLE_DRIVERS = [
  {
    name: 'John Driver',
    phone: '09123456789',
    email: 'johndriver@gmail.com',
    licenseNumber: 'DL-12345',
    vehicleType: 'Motorcycle HONDA CLICK',
    licenseExpiry: 'April 20, 2029',
    customerRating: 4,
    status: 'active',
    totalDeliveries: 120,
    onTimeDelivery: 92,
    cancellations: 3,
    reviews: [
      { rating: 4, date: 'May 05, 2026', comment: 'Fast delivery and very polite.' },
      { rating: 4, date: 'May 03, 2026', comment: 'Food arrive early.' },
      { rating: 4, date: 'May 02, 2026', comment: 'Great service thank you.' },
    ],
    notes: 'Reliable driver with good performance',
  },
  {
    name: 'Ghost Driver',
    phone: '09987654321',
    email: 'ghostdriver@gmail.com',
    licenseNumber: 'DL-67890',
    vehicleType: 'Motorcycle Yamaha Mio',
    licenseExpiry: 'April 20, 2026',
    customerRating: 4,
    status: 'inactive',
    totalDeliveries: 85,
    onTimeDelivery: 88,
    cancellations: 5,
    reviews: [
      { rating: 4, date: 'May 05, 2026', comment: 'Fast delivery and very polite.' },
      { rating: 4, date: 'May 03, 2026', comment: 'Food arrive early.' },
    ],
    notes: '',
  },
  {
    name: 'Johnny Klebitz',
    phone: '09112233445',
    email: 'johnnyk@gmail.com',
    licenseNumber: 'DL-11223',
    vehicleType: 'Motorcycle Honda Beat',
    licenseExpiry: 'April 20, 2026',
    customerRating: 4,
    status: 'active',
    totalDeliveries: 200,
    onTimeDelivery: 95,
    cancellations: 1,
    reviews: [
      { rating: 4, date: 'May 02, 2026', comment: 'Great service thank you.' },
    ],
    notes: '',
  },
];

// Helper to calculate days left for license expiry
const getDaysLeft = (expiryDateStr) => {
  if (!expiryDateStr) return { days: 0, text: 'N/A', statusClass: 'expiry-red' };
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(expiry.getTime())) {
    return { days: 0, text: expiryDateStr, statusClass: 'expiry-green' };
  }

  const diffTime = expiry - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days > 60) {
    return { days, text: `${days} days left`, statusClass: 'expiry-green' };
  } else if (days >= 30) {
    return { days, text: `${days} days left`, statusClass: 'expiry-orange' };
  } else if (days >= 0) {
    return { days, text: `${days} days left`, statusClass: 'expiry-red' };
  } else {
    return { days, text: 'Expired', statusClass: 'expiry-red' };
  }
};

// Render star rating icons
const renderStars = (rating) => {
  const stars = [];
  const r = Math.round(Number(rating) || 0);
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <LuStar
        key={i}
        className={i <= r ? 'star-icon star-filled' : 'star-icon star-empty'}
      />
    );
  }
  return stars;
};

function Driver() {
  const { drivers = [], addDriver, updateDriver } = useDriver() || {};

  // UI Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedSort, setSelectedSort] = useState('By: Rating High to Low');
  const [currentPage, setCurrentPage] = useState(1);

  // Driver Details Panel State
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Inline Notes Edit State inside Panel
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Handle loading sample drivers for testing
  const handleLoadSampleDrivers = () => {
    SAMPLE_DRIVERS.forEach((sample) => addDriver(sample));
  };

  // Filter and Sort drivers
  const filteredDrivers = drivers
    .filter((driver) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        driver.name.toLowerCase().includes(q) ||
        driver.driverId.toLowerCase().includes(q) ||
        driver.phone.toLowerCase().includes(q) ||
        driver.email.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === 'All Status' ||
        driver.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (selectedSort === 'By: Rating High to Low') {
        return (b.customerRating || 0) - (a.customerRating || 0);
      }
      if (selectedSort === 'By: Rating Low to High') {
        return (a.customerRating || 0) - (b.customerRating || 0);
      }
      if (selectedSort === 'By: Name A-Z') {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === 'By: Name Z-A') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  // Table Pagination
  const DRIVERS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE) || 1;
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * DRIVERS_PER_PAGE,
    currentPage * DRIVERS_PER_PAGE
  );

  const showingStart = filteredDrivers.length === 0 ? 0 : (currentPage - 1) * DRIVERS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * DRIVERS_PER_PAGE, filteredDrivers.length);

  // Handle Open View Panel
  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    setNotesText(driver.notes || '');
    setIsEditingNotes(false);
    setIsPanelOpen(true);
  };

  // Save Inline Notes
  const handleSaveNotes = () => {
    if (selectedDriver) {
      const updated = { ...selectedDriver, notes: notesText };
      updateDriver(selectedDriver.id, updated);
      setSelectedDriver(updated);
      setIsEditingNotes(false);
    }
  };

  // Cancel Inline Notes Edit
  const handleCancelNotes = () => {
    setNotesText(selectedDriver?.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <div className="driver-page">
      {/* Top Header Section */}
      <div className="driver-header">
        <h1 className="driver-title">Drivers Management</h1>
      </div>

      {/* Filter Bar */}
      <div className="driver-filter-bar">
        <div className="search-input-wrapper">
          <LuSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search driver name or ID, or contact..."
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
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All Status">Status: All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <LuChevronDown className="select-chevron-icon" />
        </div>

        <div className="select-dropdown-wrapper">
          <select
            className="filter-select"
            value={selectedSort}
            onChange={(e) => {
              setSelectedSort(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="By: Rating High to Low">By: Rating High to Low</option>
            <option value="By: Rating Low to High">By: Rating Low to High</option>
            <option value="By: Name A-Z">By: Name A-Z</option>
            <option value="By: Name Z-A">By: Name Z-A</option>
          </select>
          <LuChevronDown className="select-chevron-icon" />
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="table-card">
        {filteredDrivers.length === 0 ? (
          /* Empty State */
          <div className="empty-state-container">
            <div className="empty-state-icon-box">
              <LuUser className="empty-state-icon" />
            </div>
            <h3 className="empty-state-title">No drivers yet</h3>
            <p className="empty-state-subtext">
              Driver accounts are created by the Owner via Account Management
            </p>
            <button className="btn btn-sample-drivers" onClick={handleLoadSampleDrivers}>
              Load Sample Drivers
            </button>
          </div>
        ) : (
          /* Drivers Table */
          <div className="table-responsive">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Name</th>
                  <th>License Number</th>
                  <th>Vehicle Type</th>
                  <th>License Expiry</th>
                  <th>Customer Rating</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.map((driver) => {
                  const expiryInfo = getDaysLeft(driver.licenseExpiry);

                  return (
                    <tr key={driver.id}>
                      {/* Driver ID */}
                      <td className="driver-id-cell">{driver.driverId}</td>

                      {/* Name bold + Phone below */}
                      <td>
                        <div className="driver-name-cell">
                          <span className="driver-name-bold">{driver.name}</span>
                          <span className="driver-phone-gray">{driver.phone}</span>
                        </div>
                      </td>

                      {/* License Number */}
                      <td className="text-dark">{driver.licenseNumber}</td>

                      {/* Vehicle Type */}
                      <td className="text-dark uppercase-vehicle">{driver.vehicleType}</td>

                      {/* License Expiry + Days left colored below */}
                      <td>
                        <div className="expiry-cell">
                          <span className="expiry-date">{driver.licenseExpiry}</span>
                          <span className={`expiry-days ${expiryInfo.statusClass}`}>
                            {expiryInfo.text}
                          </span>
                        </div>
                      </td>

                      {/* Customer Rating */}
                      <td>
                        <div className="rating-cell">
                          <div className="stars-row">{renderStars(driver.customerRating)}</div>
                          <span className="rating-num">{driver.customerRating}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={`status-badge badge-${driver.status.toLowerCase()}`}>
                          {driver.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action button */}
                      <td className="text-right">
                        <button
                          className="btn-view-outline"
                          onClick={() => handleViewDriver(driver)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {filteredDrivers.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-info">
              Showing {showingStart} to {showingEnd} of {filteredDrivers.length} drivers
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
      {/* DRIVER DETAILS PANEL (Slide-in from Right Side) */}
      {/* ========================================================================= */}
      {isPanelOpen && (
        <div className="panel-overlay" onClick={() => setIsPanelOpen(false)}>
          <div className="driver-details-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2 className="panel-title">Driver Details</h2>
              <button className="panel-close-x" onClick={() => setIsPanelOpen(false)}>
                <LuX />
              </button>
            </div>

            {selectedDriver && (
              <div className="panel-content">
                {/* 1. Top Profile Header */}
                <div className="profile-header-card">
                  <div className="avatar-circle">
                    <LuUser className="avatar-icon" />
                  </div>
                  <div className="profile-info">
                    <div className="name-and-status">
                      <span className="panel-driver-name">{selectedDriver.name}</span>
                      <span
                        className={`status-badge badge-${selectedDriver.status.toLowerCase()}`}
                      >
                        {selectedDriver.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="panel-driver-id">{selectedDriver.driverId}</div>
                    <div className="contact-item">
                      <LuPhone className="contact-icon" /> {selectedDriver.phone}
                    </div>
                    <div className="contact-item">
                      <LuMail className="contact-icon" /> {selectedDriver.email}
                    </div>
                  </div>
                </div>

                {/* 2. Driver Details Section */}
                <div className="panel-section">
                  <h4 className="panel-section-title">Driver Details</h4>
                  <div className="details-list">
                    <div className="detail-item">
                      <LuBike className="detail-icon" />
                      <span className="detail-label">Vehicle Type</span>
                      <span className="detail-value text-right">{selectedDriver.vehicleType}</span>
                    </div>
                    <div className="detail-item">
                      <LuIdCard className="detail-icon" />
                      <span className="detail-label">License Number</span>
                      <span className="detail-value text-right">{selectedDriver.licenseNumber}</span>
                    </div>
                    <div className="detail-item">
                      <LuCalendar className="detail-icon" />
                      <span className="detail-label">License Expiry</span>
                      <span className="detail-value text-right">
                        {selectedDriver.licenseExpiry}{' '}
                        <span className={getDaysLeft(selectedDriver.licenseExpiry).statusClass}>
                          ({getDaysLeft(selectedDriver.licenseExpiry).text})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Performance Summary Section */}
                <div className="panel-section">
                  <h4 className="panel-section-title">Performance Summary</h4>
                  <div className="performance-grid">
                    <div className="perf-box">
                      <span className="perf-label">Total Deliveries</span>
                      <span className="perf-value text-dark">{selectedDriver.totalDeliveries || 0}</span>
                    </div>
                    <div className="perf-box">
                      <span className="perf-label">On-Time Delivery</span>
                      <span className="perf-value text-green">{selectedDriver.onTimeDelivery || 0}%</span>
                    </div>
                    <div className="perf-box">
                      <span className="perf-label">Cancellations</span>
                      <span className="perf-value text-red">{selectedDriver.cancellations || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Customer Reviews Section */}
                <div className="panel-section">
                  <h4 className="panel-section-title">
                    Customer Reviews ({selectedDriver.customerRating || 4}/5)
                  </h4>
                  {selectedDriver.reviews && selectedDriver.reviews.length > 0 ? (
                    <div className="reviews-list">
                      {selectedDriver.reviews.map((rev, index) => (
                        <div className="review-card" key={index}>
                          <div className="review-header">
                            <div className="review-stars">
                              {renderStars(rev.rating)}
                              <span className="review-rating-num">{rev.rating}</span>
                            </div>
                            <span className="review-date">{rev.date}</span>
                          </div>
                          <p className="review-comment">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-reviews-msg">No reviews yet</div>
                  )}
                </div>

                {/* 5. Notes Section with Inline Edit */}
                <div className="panel-section">
                  <div className="notes-header">
                    <h4 className="panel-section-title">Notes</h4>
                    {!isEditingNotes && (
                      <button
                        className="btn-edit-notes"
                        title="Edit Notes"
                        onClick={() => setIsEditingNotes(true)}
                      >
                        <LuPencil />
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="notes-edit-wrapper">
                      <textarea
                        className="notes-textarea"
                        rows="3"
                        placeholder="Add notes about driver..."
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        autoFocus
                      />
                      <div className="notes-actions">
                        <button className="btn btn-cancel-sm" onClick={handleCancelNotes}>
                          Cancel
                        </button>
                        <button className="btn btn-save-sm" onClick={handleSaveNotes}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="notes-display-box">
                      {selectedDriver.notes ? selectedDriver.notes : 'No notes added yet'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Full-Width Close Button */}
            <div className="panel-footer">
              <button className="btn-close-panel" onClick={() => setIsPanelOpen(false)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Driver;

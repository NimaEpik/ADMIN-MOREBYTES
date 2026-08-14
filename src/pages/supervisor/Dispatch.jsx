import { useState, useMemo } from 'react';
import { useOrders } from '../../context/OrdersContext';
import { useDriver } from '../../context/DriverContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LuClock,
  LuBike,
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuMaximize2,
  LuMinimize2,
  LuEye,
  LuCircleCheck,
  LuCircleX,
  LuSend,
  LuMapPin,
  LuNavigation,
  LuInfo,
} from 'react-icons/lu';
import './Dispatch.css';

// Fix Leaflet default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Dispatch() {
  // Context hooks
  const { orders, updateOrderStatus } = useOrders();
  const { drivers } = useDriver();

  // Local component states
  const [pendingPage, setPendingPage] = useState(1);
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [riderError, setRiderError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [activeMapOrder, setActiveMapOrder] = useState(null);

  const ITEMS_PER_PAGE = 5;

  // Filter pending online orders (status === 'Preparing' AND orderType === 'Online Order')
  const pendingOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(
      (o) => o.status === 'Preparing' && o.orderType === 'Online Order'
    );
  }, [orders]);

  // Paginated pending orders
  const totalPendingPages = Math.ceil(pendingOrders.length / ITEMS_PER_PAGE) || 1;
  const startPendingIdx = (pendingPage - 1) * ITEMS_PER_PAGE;
  const paginatedPending = pendingOrders.slice(
    startPendingIdx,
    startPendingIdx + ITEMS_PER_PAGE
  );

  // Filter active delivery status monitoring orders (status === 'Out for Delivery' OR status === 'Completed' OR status === 'completed')
  const monitoredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(
      (o) =>
        o.status === 'Out for Delivery' ||
        o.status === 'Completed' ||
        o.status === 'completed'
    );
  }, [orders]);

  // Active drivers list (status === 'active')
  const activeDrivers = useMemo(() => {
    if (!drivers) return [];
    return drivers.filter((d) => d.status === 'active');
  }, [drivers]);

  // Open modal to assign rider
  const handleOpenAssignModal = (order) => {
    setAssignModalOrder(order);
    setSelectedRiderId('');
    setRiderError('');
  };

  // Close assign rider modal
  const handleCloseAssignModal = () => {
    setAssignModalOrder(null);
    setSelectedRiderId('');
    setRiderError('');
  };

  // Handle assigning delivery to selected rider
  const handleAssignDelivery = () => {
    if (!selectedRiderId) {
      setRiderError('Please select an available rider');
      return;
    }

    const riderObj = activeDrivers.find(
      (d) => String(d.id) === String(selectedRiderId) || d.name === selectedRiderId
    );

    const assignedRiderInfo = riderObj
      ? { id: riderObj.id, name: riderObj.name, phone: riderObj.phone }
      : { id: selectedRiderId, name: selectedRiderId, phone: '+63 912 345 6789' };

    // Update order status in context to Out for Delivery
    updateOrderStatus(assignModalOrder.id, 'Out for Delivery', assignedRiderInfo);

    // Save for live map focus
    setActiveMapOrder({
      ...assignModalOrder,
      status: 'Out for Delivery',
      driver: assignedRiderInfo,
    });

    // Reset modal state
    setAssignModalOrder(null);
    setSelectedRiderId('');
    setRiderError('');
  };

  // Map coordinates (Cagayan de Oro City sample coordinates)
  const customerCoords = [8.4542, 124.6319];
  const riderCoords = [8.4600, 124.6400];
  const routeCoords = [riderCoords, customerCoords];

  return (
    <div className="dispatch-container">
      {/* Page Title */}
      <div className="dispatch-header">
        <h1 className="dispatch-title">Dispatch Management</h1>
      </div>

      {/* Section 1 — Pending Deliveries Table */}
      <div className="dispatch-card pending-card">
        <div className="dispatch-section-header">
          <div className="section-title-group">
            <LuClock className="icon-orange" size={22} />
            <h2 className="section-title">Pending Deliveries</h2>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dispatch-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Order Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPending.length > 0 ? (
                paginatedPending.map((order) => (
                  <tr key={order.id || order.orderId}>
                    <td className="order-id-cell">{order.orderId}</td>
                    <td>{order.customerName}</td>
                    <td className="address-cell">{order.address || order.customerAddress || 'N/A'}</td>
                    <td className="price-cell">₱{order.total}</td>
                    <td>
                      <span className="badge badge-waiting">
                        Waiting for rider
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-assign-rider"
                        onClick={() => handleOpenAssignModal(order)}
                      >
                        Assign Rider
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state-cell">
                    <div className="empty-state-box">
                      <p className="empty-state-title">No pending deliveries</p>
                      <p className="empty-state-sub">
                        Orders that are preparing and need a rider will appear here
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="dispatch-pagination">
          <div className="pagination-info">
            Showing{' '}
            {pendingOrders.length > 0 ? startPendingIdx + 1 : 0} to{' '}
            {Math.min(startPendingIdx + ITEMS_PER_PAGE, pendingOrders.length)} of{' '}
            {pendingOrders.length} pending deliveries
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={pendingPage === 1}
              onClick={() => setPendingPage((prev) => Math.max(prev - 1, 1))}
            >
              <LuChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  className={`pagination-btn ${
                    pageNum === pendingPage ? 'active' : ''
                  }`}
                  onClick={() => setPendingPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            )}
            <button
              className="pagination-btn"
              disabled={pendingPage === totalPendingPages}
              onClick={() =>
                setPendingPage((prev) => Math.min(prev + 1, totalPendingPages))
              }
            >
              <LuChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2 — Bottom Two Panels Side By Side */}
      <div className="dispatch-bottom-panels">
        {/* Left Panel — Live Delivery Map */}
        <div className={`dispatch-card map-panel ${isFullScreen ? 'is-fullscreen-wrapper' : ''}`}>
          <div className="dispatch-section-header">
            <div>
              <div className="section-title-group">
                <LuMapPin className="icon-orange" size={20} />
                <h2 className="section-title">Live Delivery Map</h2>
              </div>
              <p className="section-subtitle">
                Real time view of customer location, rider location and route
              </p>
            </div>
            <button
              className="btn-fullscreen-toggle"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              {isFullScreen ? (
                <>
                  <LuMinimize2 size={16} /> Exit Full Screen
                </>
              ) : (
                <>
                  <LuMaximize2 size={16} /> Full Screen
                </>
              )}
            </button>
          </div>

          <div className={`map-container-box ${isFullScreen ? 'fullscreen-map' : ''}`}>
            <MapContainer
              center={[8.4542, 124.6319]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '350px', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Customer Marker */}
              <Marker position={customerCoords}>
                <Popup>
                  <strong>Customer Location</strong>
                  <br />
                  {activeMapOrder
                    ? `${activeMapOrder.customerName} - ${activeMapOrder.orderId}`
                    : 'Zone 5, Carmen, CDO City'}
                </Popup>
              </Marker>
              {/* Rider Marker */}
              <Marker position={riderCoords}>
                <Popup>
                  <strong>Rider Location</strong>
                  <br />
                  {activeMapOrder?.driverName || activeMapOrder?.driver?.name || 'Rider Mark (2.5 km away)'}
                </Popup>
              </Marker>
              {/* Route Polyline */}
              <Polyline positions={routeCoords} color="#FFA500" weight={4} dashArray="8, 8" />
            </MapContainer>
          </div>

          {/* Map Legend */}
          <div className="map-legend">
            <span className="legend-item">
              <span className="dot dot-blue"></span> Customer Location
            </span>
            <span className="legend-item">
              <span className="dot dot-green"></span> Rider Location
            </span>
            <span className="legend-item">
              <span className="dot dot-orange"></span> Delivery Route
            </span>
          </div>

          {/* Map Footer Bar */}
          <div className="map-footer-stats">
            <div className="stat-pill">
              <LuNavigation size={15} />
              <span>Estimated Distance: <strong>4.6 km</strong></span>
            </div>
            <div className="stat-pill-divider">|</div>
            <div className="stat-pill">
              <LuClock size={15} />
              <span>Estimated Time: <strong>12 mins</strong></span>
            </div>
          </div>
        </div>

        {/* Right Panel — Delivery Status Monitoring */}
        <div className="dispatch-card status-monitoring-panel">
          <div className="dispatch-section-header">
            <div>
              <div className="section-title-group">
                <LuBike className="icon-green" size={22} />
                <h2 className="section-title">Delivery Status Monitoring</h2>
              </div>
              <p className="section-subtitle">
                Track the status of ongoing deliveries
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dispatch-table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Assigned Order</th>
                  <th>Status</th>
                  <th>Last Update</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {monitoredOrders.length > 0 ? (
                  monitoredOrders.map((order) => {
                    const riderName =
                      order.driverName || order.driver?.name || 'Mark';
                    const riderPhone =
                      order.driverPhone || order.driver?.phone || '+63 912 345 6789';
                    const isOut = order.status === 'Out for Delivery';
                    const isDelivered =
                      order.status === 'Completed' || order.status === 'completed';

                    return (
                      <tr key={order.id || order.orderId}>
                        <td>
                          <div className="rider-profile-cell">
                            <div className="rider-avatar">
                              {riderName.charAt(0).toUpperCase()}
                            </div>
                            <div className="rider-info-text">
                              <span className="rider-name">{riderName}</span>
                              <span className="rider-phone">{riderPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="order-id-cell">{order.orderId}</td>
                        <td>
                          {isOut && (
                            <span className="badge badge-out-for-delivery">
                              Out for Delivery
                            </span>
                          )}
                          {isDelivered && (
                            <span className="badge badge-delivered">
                              Delivered
                            </span>
                          )}
                          {!isOut && !isDelivered && (
                            <span className="badge badge-cancelled">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="update-time-cell">
                          {order.updatedAt || '10:45 AM, May 30, 2026'}
                        </td>
                        <td>
                          <button
                            className="btn-view-outline"
                            onClick={() => {
                              setViewingOrder(order);
                              setActiveMapOrder(order);
                            }}
                          >
                            <LuEye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state-cell">
                      <div className="empty-state-box">
                        <p className="empty-state-title">No active deliveries</p>
                        <p className="empty-state-sub">
                          Assigned deliveries will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Status legend removed per design request */}
        </div>
      </div>

      {/* Assign Rider Modal */}
      {assignModalOrder && (
        <div className="modal-overlay">
          <div className="modal-container assign-rider-modal">
            <div className="modal-header">
              <div className="modal-title">
                <LuBike className="icon-orange" size={22} />
                <h3>Assign Rider</h3>
              </div>
              <button
                className="btn-close-modal"
                onClick={handleCloseAssignModal}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Order summary box */}
              <div className="order-details-box">
                <div className="detail-row">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value bold">{assignModalOrder.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Customer</span>
                  <span className="detail-value">{assignModalOrder.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{assignModalOrder.address || assignModalOrder.customerAddress || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Total</span>
                  <span className="detail-value price">₱{assignModalOrder.total}</span>
                </div>
              </div>

              {/* Rider dropdown selection */}
              <div className="form-group">
                <label className="form-label">
                  Select Rider<span className="required-star">*</span>
                </label>
                <select
                  className={`form-select ${riderError ? 'input-error' : ''}`}
                  value={selectedRiderId}
                  onChange={(e) => {
                    setSelectedRiderId(e.target.value);
                    setRiderError('');
                  }}
                >
                  <option value="">Select an available rider</option>
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      Rider - {driver.name}
                    </option>
                  ))}
                </select>
                {riderError && (
                  <p className="error-message-text">{riderError}</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-assign-submit"
                onClick={handleAssignDelivery}
              >
                <LuSend size={16} /> Assign Delivery
              </button>
              <button
                className="btn-cancel-modal"
                onClick={handleCloseAssignModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Delivery Details Modal */}
      {viewingOrder && (
        <div className="modal-overlay">
          <div className="modal-container view-order-modal">
            <div className="modal-header">
              <div className="modal-title">
                <LuInfo className="icon-orange" size={22} />
                <h3>Delivery Details</h3>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setViewingOrder(null)}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-box">
                <div className="detail-row">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value bold">{viewingOrder.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Customer Name</span>
                  <span className="detail-value">{viewingOrder.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{viewingOrder.address || viewingOrder.customerAddress || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Rider Assigned</span>
                  <span className="detail-value font-medium">
                    {viewingOrder.driverName || viewingOrder.driver?.name || 'Mark'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Status</span>
                  <span className="detail-value">
                    <span
                      className={`badge ${
                        viewingOrder.status === 'Out for Delivery'
                          ? 'badge-out-for-delivery'
                          : 'badge-delivered'
                      }`}
                    >
                      {viewingOrder.status}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Total</span>
                  <span className="detail-value price">₱{viewingOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel-modal"
                onClick={() => setViewingOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispatch;

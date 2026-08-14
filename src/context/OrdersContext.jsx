import { createContext, useContext, useState } from 'react';
import { useInventory } from './InventoryContext';

const OrdersContext = createContext(null);

// Format order ID like ORD-0001
const formatOrderId = (num) => `ORD-${String(num).padStart(5, '0')}`;

const INITIAL_ORDERS = [
  {
    id: 101,
    orderId: 'ORD-00040',
    customerName: 'John Customer',
    address: 'Uptown Rizal St. CDO',
    orderType: 'Online Order',
    items: [{ name: 'Burger Combo', quantity: 2, price: 270 }],
    total: 540,
    status: 'Preparing',
    createdAt: '2026-05-30T10:00:00.000Z',
  },
  {
    id: 102,
    orderId: 'ORD-00041',
    customerName: 'John Buyer',
    address: 'Kauswagan, CDO',
    orderType: 'Online Order',
    items: [{ name: 'Chicken Wings', quantity: 3, price: 180 }],
    total: 540,
    status: 'Preparing',
    createdAt: '2026-05-30T10:15:00.000Z',
  },
  {
    id: 103,
    orderId: 'ORD-00042',
    customerName: 'John Loan',
    address: 'Down Town, New York',
    orderType: 'Online Order',
    items: [{ name: 'Pizza Special', quantity: 1, price: 540 }],
    total: 540,
    status: 'Preparing',
    createdAt: '2026-05-30T10:20:00.000Z',
  },
  {
    id: 104,
    orderId: 'ORD-001',
    customerName: 'Mark Customer',
    address: 'Zone 5, Carmen, CDO City',
    orderType: 'Online Order',
    items: [{ name: 'Pepperoni Pizza', quantity: 1, price: 350 }],
    total: 350,
    status: 'Out for Delivery',
    driverName: 'Mark',
    driverPhone: '+62 912 345 6789',
    updatedAt: '10:15 AM, May 25, 2026',
    createdAt: '2026-05-25T10:15:00.000Z',
  },
  {
    id: 105,
    orderId: 'ORD-002',
    customerName: 'John Buyer 2',
    address: 'Lapasan, CDO',
    orderType: 'Online Order',
    items: [{ name: 'Cheeseburger Combo', quantity: 2, price: 220 }],
    total: 440,
    status: 'Out for Delivery',
    driverName: 'John',
    driverPhone: '+63 912 379 5432',
    updatedAt: '10:30 AM, May 25, 2026',
    createdAt: '2026-05-25T10:30:00.000Z',
  },
  {
    id: 106,
    orderId: 'ORD-003',
    customerName: 'Kevin Client',
    address: 'Nazareth, CDO',
    orderType: 'Online Order',
    items: [{ name: 'Family Meal Deal', quantity: 1, price: 890 }],
    total: 890,
    status: 'Completed',
    driverName: 'Kevin',
    driverPhone: '+63 912 913 2222',
    updatedAt: '11:00 AM, May 25, 2026',
    createdAt: '2026-05-25T11:00:00.000Z',
  },
];

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [orderCounter, setOrderCounter] = useState(43);
  const inventoryContext = useInventory();
  const deductStock = inventoryContext?.deductStock;

  // Add a new order from POS
  const addOrder = (orderData) => {
    const formattedId = formatOrderId(orderCounter);
    const newOrder = {
      id: Date.now(),
      orderId: formattedId,
      customerName: orderData.customerName,
      address: orderData.address || orderData.customerAddress || 'Cagayan de Oro City',
      orderType: orderData.orderType,
      items: orderData.items,
      total: orderData.total,
      status: orderData.orderType === 'Online Order' ? 'Pending' : 'Preparing',
      createdAt: new Date().toISOString(),
    };

    // Deduct stock automatically for each item in the order
    if (orderData.items && Array.isArray(orderData.items) && deductStock) {
      orderData.items.forEach((item) => {
        const name = item.name || item.itemName;
        const qty = item.quantity || item.qty || 1;
        if (name) {
          deductStock(name, qty, formattedId);
        }
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    setOrderCounter((prev) => prev + 1);
    return newOrder;
  };

  // Update order status (with optional driver details)
  const updateOrderStatus = (orderId, newStatus, driverInfo = null) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderId === orderId) {
          const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return {
            ...o,
            status: newStatus,
            updatedAt: nowStr,
            ...(driverInfo
              ? {
                  driver: driverInfo,
                  driverName: driverInfo.name,
                  driverPhone: driverInfo.phone,
                }
              : {}),
          };
        }
        return o;
      })
    );
  };

  // Cancel order
  const cancelOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status: 'Cancelled' } : o))
    );
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        orderCounter,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        formatOrderId,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}


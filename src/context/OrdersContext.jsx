import { createContext, useContext, useState } from 'react';

const OrdersContext = createContext(null);

// Format order ID like ORD-0001
const formatOrderId = (num) => `ORD-${String(num).padStart(4, '0')}`;

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [orderCounter, setOrderCounter] = useState(1);

  // Add a new order from POS
  const addOrder = (orderData) => {
    const newOrder = {
      id: Date.now(),
      orderId: formatOrderId(orderCounter),
      customerName: orderData.customerName,
      orderType: orderData.orderType,
      items: orderData.items,
      total: orderData.total,
      status: orderData.orderType === 'Online Order' ? 'Pending' : 'Preparing',
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setOrderCounter((prev) => prev + 1);
    return newOrder;
  };

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Cancel order
  const cancelOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
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

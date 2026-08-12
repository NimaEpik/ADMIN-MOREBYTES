import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

// Context for managing inventory state and stock movement history
const InventoryContext = createContext(null);

// Status Auto-Calculation Helper
// currentStock === 0 → "Out of Stock"
// currentStock > 0 && currentStock <= reorderPoint → "Low Stock"
// currentStock > reorderPoint → "Sufficient"
export const calculateStockStatus = (currentStock, reorderPoint) => {
  const stock = Number(currentStock) || 0;
  const reorder = Number(reorderPoint) || 0;
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorder) return 'Low Stock';
  return 'Sufficient';
};

// Provider Component
export function InventoryProvider({ children }) {
  const { user } = useAuth();

  const resolvePerformer = (override) => override || user?.name || 'System';

  // Initialize with empty arrays (no hardcoded data)
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Helper to add activity log record
  const addLog = (logData) => {
    const newLog = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString(),
      ...logData,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Add new inventory item
  const addItem = (itemData) => {
    const now = new Date().toISOString();
    const stock = Number(itemData.currentStock) || 0;
    const reorder = Number(itemData.reorderPoint) || 0;
    const status = calculateStockStatus(stock, reorder);

    const newItem = {
      id: Date.now(),
      name: itemData.name.trim(),
      category: itemData.category,
      currentStock: stock,
      reorderPoint: reorder,
      lastUpdated: now,
      createdAt: now,
      status: status,
    };

    setInventoryItems((prev) => [newItem, ...prev]);

    // Log addition action
    addLog({
      itemName: newItem.name,
      category: newItem.category,
      action: 'Restock',
      quantity: `+${stock} pcs`,
      newStock: `${stock} pcs`,
      reason: 'Initial Stock Addition',
      performedBy: resolvePerformer(),
    });
  };

  // Restock existing item by ID
  const restockItem = (id, quantityToAdd, performer) => {
    const qty = Number(quantityToAdd) || 0;
    if (qty <= 0) return;
    const now = new Date().toISOString();
    const performerName = resolvePerformer(performer);
    let updatedTarget = null;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = item.currentStock + qty;
          const updated = {
            ...item,
            currentStock: newStock,
            lastUpdated: now,
            status: calculateStockStatus(newStock, item.reorderPoint),
          };
          updatedTarget = updated;
          return updated;
        }
        return item;
      })
    );

    if (updatedTarget) {
      addLog({
        itemName: updatedTarget.name,
        category: updatedTarget.category,
        action: 'Restock',
        quantity: `+${qty} pcs`,
        newStock: `${updatedTarget.currentStock} pcs`,
        reason: 'Manual Restock',
        performedBy: performerName,
      });
    }
  };

  // Edit existing item details by ID
  const editItem = (id, updatedItemData) => {
    const now = new Date().toISOString();
    let updatedTarget = null;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const stock = Number(updatedItemData.currentStock) || 0;
          const reorder = Number(updatedItemData.reorderPoint) || 0;
          const updated = {
            ...item,
            name: updatedItemData.name.trim(),
            category: updatedItemData.category,
            currentStock: stock,
            reorderPoint: reorder,
            lastUpdated: now,
            status: calculateStockStatus(stock, reorder),
          };
          updatedTarget = updated;
          return updated;
        }
        return item;
      })
    );

    if (updatedTarget) {
      addLog({
        itemName: updatedTarget.name,
        category: updatedTarget.category,
        action: 'Manual Adjustment',
        quantity: `${updatedTarget.currentStock} pcs`,
        newStock: `${updatedTarget.currentStock} pcs`,
        reason: 'Item Details Updated',
        performedBy: resolvePerformer(),
      });
    }
  };

  // Deduct stock when an order is placed
  const deductStock = (itemName, quantityToDeduct, orderId = null) => {
    const qty = Number(quantityToDeduct) || 1;
    const now = new Date().toISOString();
    let updatedTarget = null;

    setInventoryItems((prev) =>
      prev.map((item) => {
        // Match item by name (case-insensitive)
        const match =
          item.name.toLowerCase() === itemName.toLowerCase() ||
          item.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(item.name.toLowerCase());

        if (match) {
          const newStock = Math.max(0, item.currentStock - qty);
          const updated = {
            ...item,
            currentStock: newStock,
            lastUpdated: now,
            status: calculateStockStatus(newStock, item.reorderPoint),
          };
          updatedTarget = updated;
          return updated;
        }
        return item;
      })
    );

    if (updatedTarget) {
      const orderRef = orderId ? orderId : `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      addLog({
        itemName: updatedTarget.name,
        category: updatedTarget.category,
        action: 'Stock Deducted',
        quantity: `-${qty} pcs`,
        newStock: `${updatedTarget.currentStock} pcs`,
        reason: `Customer Order #${orderRef}`,
        performedBy: 'System',
      });
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        inventoryItems,
        activityLogs,
        addItem,
        restockItem,
        editItem,
        deductStock,
        calculateStockStatus,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// Custom Hook to consume Inventory Context
export function useInventory() {
  return useContext(InventoryContext);
}

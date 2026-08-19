import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

// Context for managing inventory state and stock movement history
const InventoryContext = createContext(null);

// Helper to compute days remaining until expiry
const calculateDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;

  const [year, month, day] = expiryDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const expiryUtc = Date.UTC(year, month - 1, day);
  return Math.round((expiryUtc - todayUtc) / (1000 * 60 * 60 * 24));
};

// Status Auto-Calculation Helper
// currentStock === 0 → "Out of Stock"
// currentStock > 0 && currentStock <= reorderPoint → "Low Stock"
// daysLeft === 0 → "Expires Today"
// daysLeft > 0 && daysLeft <= 7 → "Expiring Soon"
// daysLeft < 0 → "Expired"
// Everything else → "Sufficient"
export const calculateStockStatus = (currentStock, reorderPoint, expiryDate) => {
  const stock = Number(currentStock) || 0;
  const reorder = Number(reorderPoint) || 0;

  // Stock-level checks take priority
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorder) return 'Low Stock';

  // Expiry-based checks
  const daysLeft = calculateDaysLeft(expiryDate);
  if (daysLeft !== null) {
    if (daysLeft === 0) return 'Expires Today';
    if (daysLeft > 0 && daysLeft <= 7) return 'Expiring Soon';
    if (daysLeft < 0) return 'Expired';
  }

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
    const daysLeft = calculateDaysLeft(itemData.expiryDate);
    const status = calculateStockStatus(stock, reorder, itemData.expiryDate);

    const newItem = {
      id: Date.now(),
      name: itemData.name.trim(),
      category: itemData.category,
      currentStock: stock,
      reorderPoint: reorder,
      datePlaced: itemData.datePlaced || now.split('T')[0], // date placed field
      expiryDate: itemData.expiryDate || '', // expiry date "YYYY-MM-DD"
      daysLeft,
      lastUpdated: now,
      createdAt: now,
      status: status,
    };

    setInventoryItems((prev) => [newItem, ...prev]);

    // Log addition action (newly added stock)
    addLog({
      itemName: newItem.name,
      category: newItem.category,
      action: 'New Stock',
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
            daysLeft: calculateDaysLeft(item.expiryDate),
            lastUpdated: now,
            status: calculateStockStatus(newStock, item.reorderPoint, item.expiryDate),
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
        action: 'Restocked',
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
          const expiryDate = updatedItemData.expiryDate || item.expiryDate;
          const updated = {
            ...item,
            name: updatedItemData.name.trim(),
            category: updatedItemData.category,
            currentStock: stock,
            reorderPoint: reorder,
            datePlaced: updatedItemData.datePlaced || item.datePlaced, // preserve or update
            expiryDate, // preserve or update
            daysLeft: calculateDaysLeft(expiryDate),
            lastUpdated: now,
            status: calculateStockStatus(stock, reorder, expiryDate),
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
            daysLeft: calculateDaysLeft(item.expiryDate),
            lastUpdated: now,
            status: calculateStockStatus(newStock, item.reorderPoint, item.expiryDate),
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

  // Refresh computed expiry fields whenever the provider renders.
  const computedInventoryItems = inventoryItems.map((item) => ({
    ...item,
    daysLeft: calculateDaysLeft(item.expiryDate),
    status: calculateStockStatus(item.currentStock, item.reorderPoint, item.expiryDate),
  }));

  return (
    <InventoryContext.Provider
      value={{
        inventoryItems: computedInventoryItems,
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

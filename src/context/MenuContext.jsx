import { createContext, useState, useContext } from 'react';

// Context for sharing menu data globally
const MenuContext = createContext(null);

// Provider wraps the app and supplies menu state + actions
export function MenuProvider({ children }) {
  // All menu items stored here — persists across page navigation
  const [menuItems, setMenuItems] = useState([]);

  // Add a new item with auto-generated id
  const addItem = (item) => {
    const newItem = { ...item, id: Date.now() };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  // Replace an existing item by id
  const updateItem = (id, updatedItem) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
    );
  };

  // Set item status to 'archived'
  const archiveItem = (id) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'archived' } : item
      )
    );
  };

  // Restore item status to 'available'
  const restoreItem = (id) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'available' } : item
      )
    );
  };

  // Toggle availability boolean
  const toggleAvailability = (id) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, availability: !item.availability } : item
      )
    );
  };

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        addItem,
        updateItem,
        archiveItem,
        restoreItem,
        toggleAvailability,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

// Custom hook for consuming menu context
export function useMenu() {
  return useContext(MenuContext);
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { InventoryProvider } from './context/InventoryContext';
import { OrdersProvider } from './context/OrdersContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <MenuProvider>
        <InventoryProvider>
          <OrdersProvider>
            <App />
          </OrdersProvider>
        </InventoryProvider>
      </MenuProvider>
    </AuthProvider>
  </StrictMode>,
);

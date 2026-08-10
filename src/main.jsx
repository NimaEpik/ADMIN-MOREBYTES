import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { OrdersProvider } from './context/OrdersContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <MenuProvider>
        <OrdersProvider>
          <App />
        </OrdersProvider>
      </MenuProvider>
    </AuthProvider>
  </StrictMode>,
);

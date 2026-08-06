import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

import Login from '../pages/auth/Login';
import Dashboard from '../pages/supervisor/Dashboard';
import Orders from '../pages/supervisor/Orders';
import Menu from '../pages/supervisor/Menu';
import Inventory from '../pages/supervisor/Inventory';
import Dispatch from '../pages/supervisor/Dispatch';
import Driver from '../pages/supervisor/Driver';
import Reports from '../pages/supervisor/Reports';

// Redirect to login when no user is authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect to login when user role does not match
function RoleRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/orders"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Orders />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/menu"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Menu />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/inventory"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Inventory />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/dispatch"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Dispatch />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/driver"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Driver />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/reports"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="supervisor">
                <MainLayout>
                  <Reports />
                </MainLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

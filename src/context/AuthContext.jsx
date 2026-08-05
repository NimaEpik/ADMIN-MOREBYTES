import { createContext, useContext, useState } from 'react';

// Context for sharing auth state across the app
const AuthContext = createContext(null);

// Provider component that wraps the app and supplies auth state + actions
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Store logged-in user data
  const login = (userData) => {
    setUser(userData);
  };

  // Clear user on sign out
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access auth context from any component
export function useAuth() {
  return useContext(AuthContext);
}

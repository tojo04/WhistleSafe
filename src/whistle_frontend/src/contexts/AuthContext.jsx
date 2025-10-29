import { createContext, useContext, useState, useEffect } from 'react';
import { createAuthClient, login, logout, getPrincipal, isAuthenticated } from '../utils/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      const client = await createAuthClient();
      setAuthClient(client);

      const authenticated = await isAuthenticated(client);
      setIsAuth(authenticated);

      if (authenticated) {
        const principalId = await getPrincipal(client);
        setPrincipal(principalId);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!authClient) return false;

    try {
      await login(authClient);
      setIsAuth(true);
      const principalId = await getPrincipal(authClient);
      setPrincipal(principalId);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function handleLogout() {
    if (!authClient) return;

    try {
      await logout(authClient);
      setIsAuth(false);
      setPrincipal(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const value = {
    isAuthenticated: isAuth,
    principal,
    loading,
    login: handleLogin,
    logout: handleLogout,
    authClient
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

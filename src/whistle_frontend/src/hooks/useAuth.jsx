import { useState, useEffect, createContext, useContext } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { verifier_registry } from 'declarations/verifier_registry';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifier, setVerifier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const isAuth = await client.isAuthenticated();
      if (isAuth) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();

        setIdentity(identity);
        setPrincipal(principal);
        setIsAuthenticated(true);

        await checkVerification(principal);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerification = async (principal) => {
    try {
      const verified = await verifier_registry.isVerified(principal);
      setIsVerified(verified);

      if (verified) {
        const verifierData = await verifier_registry.getVerifier(principal);
        if (verifierData.length > 0) {
          setVerifier(verifierData[0]);
        }
      }
    } catch (error) {
      console.error('Verification check error:', error);
      setIsVerified(false);
    }
  };

  const login = async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);

      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();

          setIdentity(identity);
          setPrincipal(principal);
          setIsAuthenticated(true);

          await checkVerification(principal);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Login error:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setIdentity(null);
      setPrincipal(null);
      setIsAuthenticated(false);
      setIsVerified(false);
      setVerifier(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authClient,
        identity,
        principal,
        isAuthenticated,
        isVerified,
        verifier,
        isLoading,
        login,
        logout,
        checkVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

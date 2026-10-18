import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'local', public_settings: {} });

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setAuthError(null);
    const token = api.auth.getToken();
    if (!token) {
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    try {
      setIsLoadingAuth(true);
      const currentUser = await api.auth.me();
      setUser(currentUser);
      api.auth.setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      if ([401, 403].includes(error?.status)) {
        api.auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        const cachedUser = api.auth.getUser();
        if (cachedUser) {
          setUser(cachedUser);
          setIsAuthenticated(true);
        }
        setAuthError({ type: 'connection_error', message: 'Unable to verify your session right now.' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = checkUserAuth;

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout();
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

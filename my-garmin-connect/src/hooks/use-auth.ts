import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, post, setOnUnauthorized } from '@/lib/api-client';
import { saveTokens, loadTokens, clearTokens } from '@/lib/token-storage';
import type { AuthStatus, LoginRequest, LoginResponse, RestoreRequest } from '@/types/garmin';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => {
      setIsAuthenticated(false);
      setEmail(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const status = await get<AuthStatus>('/auth/status');
        if (status.authenticated) {
          setIsAuthenticated(true);
          return;
        }

        const tokens = await loadTokens();
        if (!tokens) return;

        await post<{ success: boolean }>('/auth/restore', {
          oauth1: tokens.oauth1,
          oauth2: tokens.oauth2,
        } satisfies RestoreRequest);
        setIsAuthenticated(true);
      } catch {
        await clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await post<LoginResponse>('/auth/login', { email, password } satisfies LoginRequest);
      if (response.tokens) {
        await saveTokens(response.tokens);
      }
      setIsAuthenticated(true);
      setEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } finally {
      await clearTokens();
      setIsAuthenticated(false);
      setEmail(null);
    }
  }, []);

  const value = React.useMemo(
    () => ({ isAuthenticated, isLoading, email, login, logout, error }),
    [isAuthenticated, isLoading, email, login, logout, error],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

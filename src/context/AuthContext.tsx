import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

export interface DatabaseStatus {
  connected: boolean;
  storageEngine?: string;
  totalUsers?: number;
  totalSessions?: number;
  filePath?: string;
  relativeFilePath?: string;
  fileSizeBytes?: number;
  supabase?: {
    url: string;
    connected: boolean;
    hasKey: boolean;
    maskedKey?: string;
    projectRef?: string;
  };
}

interface AuthContextType {
  user: User | null;
  authToken: string | null;
  dbStatus: DatabaseStatus;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isDbExplorerOpen: boolean;
  openDbExplorer: () => void;
  closeDbExplorer: () => void;
  loginAsDemo: () => Promise<void>;
  refreshDbStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'say_it_right_auth_user';
const TOKEN_KEY = 'say_it_right_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: true,
    storageEngine: 'SayItRight Persistent Server DB',
  });

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          connected: true,
          storageEngine: data.storageEngine || 'Persistent Server DB',
          totalUsers: data.totalUsers,
          totalSessions: data.totalSessions,
          filePath: data.filePath,
          relativeFilePath: data.relativeFilePath,
          fileSizeBytes: data.fileSizeBytes,
          supabase: data.supabase,
        });
      }
    } catch (err) {
      console.warn('Database health check offline fallback:', err);
    }
  };

  // Restore logged-in user on load via database token
  useEffect(() => {
    checkDbStatus();

    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const cachedUser = localStorage.getItem(CURRENT_USER_KEY);

        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }

        if (savedToken) {
          setAuthToken(savedToken);
          // Verify with database
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
            }
          } else if (res.status === 401) {
            // Token expired in database
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);
            setUser(null);
            setAuthToken(null);
          }
        }
      } catch (e) {
        console.error('Failed to load user session from database', e);
      }
    };

    initAuth();
  }, []);

  const register = async (name: string, email: string, pass: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, error: 'Please fill in your name, email, and password.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Password should be at least 4 characters.' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register.' };
      }

      setUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      setIsAuthModalOpen(false);
      checkDbStatus();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while connecting to database.' };
    }
  };

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid email or password.' };
      }

      setUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      setIsAuthModalOpen(false);
      checkDbStatus();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while connecting to database.' };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const loginAsDemo = async () => {
    try {
      // First try authenticating with pre-seeded database demo credentials
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'prem@example.com', password: 'demo123' }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        localStorage.setItem(TOKEN_KEY, data.token);
      } else {
        // Fallback demo account
        const demoUser: User = {
          id: 'usr_demo_guest',
          name: 'Prem',
          email: 'prem@example.com',
          createdAt: Date.now(),
        };
        setUser(demoUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser));
      }
    } catch {
      const demoUser: User = {
        id: 'usr_demo_guest',
        name: 'Prem',
        email: 'prem@example.com',
        createdAt: Date.now(),
      };
      setUser(demoUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser));
    } finally {
      setIsAuthModalOpen(false);
      checkDbStatus();
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openDbExplorer = () => setIsDbExplorerOpen(true);
  const closeDbExplorer = () => setIsDbExplorerOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        dbStatus,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isDbExplorerOpen,
        openDbExplorer,
        closeDbExplorer,
        loginAsDemo,
        refreshDbStatus: checkDbStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

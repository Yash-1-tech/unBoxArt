'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { signOut } from 'next-auth/react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'artist' | 'buyer';
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  profileImage?: string;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      // Clear both authentication sessions.
      const [ironResult, nextAuthResult] =
        await Promise.allSettled([
          fetch('/api/auth/logout', {
            method: 'POST',
            cache: 'no-store',
          }),
          signOut({ redirect: false }),
        ]);

      const ironSessionCleared =
        ironResult.status === 'fulfilled' &&
        ironResult.value.ok;

      const nextAuthSessionCleared =
        nextAuthResult.status === 'fulfilled';

      if (
        !ironSessionCleared ||
        !nextAuthSessionCleared
      ) {
        throw new Error('One or more sessions could not be cleared');
      }

      setUser(null);

      window.location.assign('/');
    } catch (error) {
      console.error('Logout failed:', error);

      // Restore the actual authentication state if logout fails.
      await fetchUser();
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refetch: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

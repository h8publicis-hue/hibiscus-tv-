"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { watchAuthState, ensureAppUser } from "@/lib/auth";
import type { AppUser } from "@/types";

interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  appUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await ensureAppUser(firebaseUser);
          setAppUser(profile);
        } catch {
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type MockSession = {
  user: {
    id: string;
    name: string;
    email: string;
    initials: string;
    role: "Admin" | "Editor" | "Viewer";
  };
  provider: "Google" | "Email";
};

type AuthSessionContextValue = {
  session: MockSession | null;
  isReady: boolean;
  signIn: (session: MockSession) => void;
  signOut: () => void;
};

const storageKey = "squad-portal.mock-session";
const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setSession(JSON.parse(stored) as MockSession);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setIsReady(true);
    }
  }, []);

  const value = useMemo<AuthSessionContextValue>(() => ({
    session,
    isReady,
    signIn: (nextSession) => {
      setSession(nextSession);
      window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
      document.cookie = `squad-portal.mock-role=${nextSession.user.role}; path=/; max-age=604800; samesite=lax`;
    },
    signOut: () => {
      setSession(null);
      window.localStorage.removeItem(storageKey);
      document.cookie = "squad-portal.mock-role=; path=/; max-age=0; samesite=lax";
    },
  }), [isReady, session]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return context;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";

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

function getInitials(name: string, email: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || email.trim().slice(0, 2).toUpperCase() || "WM";
}

export function AuthSessionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const isMockAuth = process.env.NEXT_PUBLIC_AUTH_MOCK !== "false";
  const [mockSession, setMockSession] = useState<MockSession | null>(null);
  const [isMockReady, setIsMockReady] = useState(!isMockAuth);
  const { data: betterAuthSession, isPending: isBetterAuthPending } = authClient.useSession();

  useEffect(() => {
    if (!isMockAuth) return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setMockSession(JSON.parse(stored) as MockSession);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setIsMockReady(true);
    }
  }, [isMockAuth]);

  const session = useMemo<MockSession | null>(() => {
    if (isMockAuth) return mockSession;

    const user = betterAuthSession?.user;
    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: getInitials(user.name, user.email),
        role: "Viewer",
      },
      provider: "Google",
    };
  }, [betterAuthSession, isMockAuth, mockSession]);

  const isReady = isMockAuth ? isMockReady : !isBetterAuthPending;

  const value = useMemo<AuthSessionContextValue>(() => ({
    session,
    isReady,
    signIn: (nextSession) => {
      setMockSession(nextSession);
      window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
      document.cookie = `squad-portal.mock-role=${nextSession.user.role}; path=/; max-age=604800; samesite=lax`;
    },
    signOut: () => {
      setMockSession(null);
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

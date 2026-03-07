import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthSession, type AuthSession } from "../../../src/authClient";

type AuthSessionContextValue = {
  session: AuthSession | null;
  isBootstrapping: boolean;
  setSession: (session: AuthSession | null) => void;
  refreshSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshSession = useCallback(async () => {
    const nextSession = await getAuthSession();
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const nextSession = await getAuthSession();
        if (active) {
          setSession(nextSession);
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      isBootstrapping,
      setSession,
      refreshSession
    }),
    [isBootstrapping, refreshSession, session]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}


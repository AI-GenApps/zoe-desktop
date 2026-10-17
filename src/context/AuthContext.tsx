import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadSessionToken, deleteSessionToken } from "@/lib/secure-storage";
import { captureException, captureEvent } from "@/lib/posthog";

export interface Session {
  token: string;
  userId: string;
  email: string;
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  setSession: (s: Session) => void;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const token = await loadSessionToken();
        if (!active) return;

        if (token) {
          setSessionState({ token, userId: "", email: "" });
          captureEvent("desktop_session_restored");
        } else {
          captureEvent("desktop_auth_required");
        }
      } catch (error) {
        console.error("Failed to load desktop session", error);
        captureException(error, {
          area: "auth_initialization",
          operation: "load_session_token"
        });
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setSession = useCallback((s: Session) => {
    setSessionState(s);
  }, []);

  const clearSession = useCallback(async () => {
    await deleteSessionToken();
    setSessionState(null);
  }, []);

  const contextValue = useMemo(
    () => ({ session, loading, setSession, clearSession }),
    [session, loading, setSession, clearSession]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}

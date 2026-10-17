import { useNavigate } from "react-router";
import { useAuthContext, type Session } from "@/context/AuthContext";
import { saveSessionToken } from "@/lib/secure-storage";

export function useAuth() {
  const { session, loading, setSession, clearSession } = useAuthContext();
  const navigate = useNavigate();

  async function login(s: Session) {
    await saveSessionToken(s.token);
    setSession(s);
    navigate("/today", { replace: true });
  }

  async function logout() {
    await clearSession();
    navigate("/login", { replace: true });
  }

  return {
    session,
    loading,
    isAuthenticated: session !== null,
    login,
    logout
  };
}

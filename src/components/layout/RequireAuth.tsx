import { Navigate, Outlet } from "react-router";
import { useAuthContext } from "@/context/AuthContext";

export function RequireAuth() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

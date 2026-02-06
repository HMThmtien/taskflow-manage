import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

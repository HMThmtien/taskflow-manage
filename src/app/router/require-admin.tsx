import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function RequireAdmin() {
  const role = useAuthStore((s) => s.tokens?.role);
  if (role !== "ADMIN") return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}
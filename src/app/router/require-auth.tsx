import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function RequireAuth() {
  const location = useLocation();
  const isAuthed = useAuthStore((s) => s.isAuthed());

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

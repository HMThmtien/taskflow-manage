import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function RequireAuth() {
  const isAuthed = useAuthStore((s) => s.isAuthed());

  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}
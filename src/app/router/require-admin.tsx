import { Outlet } from "react-router-dom";
import AccessDeniedPage from "@/pages/app/access-denied";
import { useAuthStore } from "@/stores/auth.store";

export function RequireAdmin() {
  const role = useAuthStore((s) => s.tokens?.role);
  if (role !== "ADMIN") {
    return (
      <AccessDeniedPage
        title="Admin access required"
        description="This area is reserved for administrators. If this looks wrong, ask an owner or admin to review your role."
      />
    );
  }
  return <Outlet />;
}

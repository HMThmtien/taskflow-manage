import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const nav = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("demo@taskflow.dev");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use demo credentials to enter the app.
        </p>

        <div className="mt-6 space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />

          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await login({ email, password });
              setLoading(false);
              nav("/app/dashboard", { replace: true });
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}

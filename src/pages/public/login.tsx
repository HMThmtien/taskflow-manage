import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";

type Mode = "login" | "register";

const cardVariants = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.22 } },
  exit: { opacity: 0, y: -8, filter: "blur(6px)", transition: { duration: 0.18 } },
};

export default function LoginPage() {
  const nav = useNavigate();
  const { toast } = useToast();

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Sign in to continue your boards."
        : "Start managing tasks like a mini-Jira.",
    [mode]
  );

  const onSubmit = async () => {
    try {
      setLoading(true);

      const u = username.trim();
      if (!u) {
        toast({ title: "Invalid username", description: "Username không được trống.", variant: "destructive" });
        return;
      }
      if (!password) {
        toast({ title: "Invalid password", description: "Password không được trống.", variant: "destructive" });
        return;
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "Confirm password không khớp.",
            variant: "destructive",
          });
          return;
        }
        await register({ username: u, password });
        toast({ title: "Registered", description: "Tạo tài khoản thành công." });
      } else {
        await login({ username: u, password });
        toast({ title: "Signed in", description: "Đăng nhập thành công." });
      }

      nav("/app/dashboard", { replace: true });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* soft background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-sky-400 to-indigo-500" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-fuchsia-400 to-rose-500" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <div className="w-full max-w-sm relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 shadow-sm"
        >
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <TabsContent key="login" value="login" forceMount asChild>
                    <motion.div variants={cardVariants} initial="hidden" animate="show" exit="exit" className="space-y-3">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                      />
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        autoComplete="current-password"
                      />

                      <Button
                        className="w-full relative overflow-hidden"
                        disabled={loading}
                        onClick={onSubmit}
                      >
                        <span className="relative z-10">{loading ? "Signing in..." : "Sign in"}</span>
                        <span className="absolute inset-0 opacity-20 bg-gradient-to-r from-sky-500 to-indigo-600" />
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Tip: dùng account bạn vừa tạo ở Postman để login.
                      </p>
                    </motion.div>
                  </TabsContent>
                ) : (
                  <TabsContent key="register" value="register" forceMount asChild>
                    <motion.div variants={cardVariants} initial="hidden" animate="show" exit="exit" className="space-y-3">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                      />
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        autoComplete="new-password"
                      />
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        type="password"
                        autoComplete="new-password"
                      />

                      <Button
                        className="w-full relative overflow-hidden"
                        disabled={loading}
                        onClick={onSubmit}
                      >
                        <span className="relative z-10">{loading ? "Creating..." : "Create account"}</span>
                        <span className="absolute inset-0 opacity-20 bg-gradient-to-r from-fuchsia-500 to-rose-600" />
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By creating an account, you’ll be signed in automatically.
                      </p>
                    </motion.div>
                  </TabsContent>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          TaskFlow • Kanban • JWT + Refresh Token
        </p>
      </div>
    </div>
  );
}
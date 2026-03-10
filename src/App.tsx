import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "./stores/auth.store";
import { useEffect } from "react";

export default function App() {
  const { toast } = useToast();
  const loadMe = useAuthStore((s) => s.loadMe );

  useEffect(() => {
    loadMe();
  }, [loadMe]);
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold">TaskFlow</h1>
        <p className="text-muted-foreground">shadcn/ui is ready ✅</p>

        <Button
          onClick={() =>
            toast({
              title: "Welcome to TaskFlow",
              description: "Toast hoạt động ngon.",
            })
          }
        >
          Test Toast
        </Button>
      </div>

      <Toaster />
    </div>
  );
}

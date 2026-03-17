import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected application error",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
            <div className="text-2xl font-semibold">Something went wrong</div>
            <p className="mt-2 text-sm text-muted-foreground">
              The app hit an unexpected error. Refresh to retry, or go back to a safer page.
            </p>
            {this.state.errorMessage ? (
              <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
                {this.state.errorMessage}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => window.location.reload()}>Reload app</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/app/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

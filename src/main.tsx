import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "@/app/router/routes";
import { QueryProvider } from "@/app/provider/query-provider";
import { AppErrorBoundary } from "@/components/app/app-error-boundary";
import { I18nProvider } from "@/features/i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </QueryProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

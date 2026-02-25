import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "@/app/router/routes";
import { QueryProvider } from "@/app/provider/query-provider";

// ✅ Chỉ bật mock khi bạn set VITE_MOCK=true trong .env
async function enableMocking() {
  if (import.meta.env.MODE !== "development") return;
  if (import.meta.env.VITE_MOCK !== "true") return;

  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </React.StrictMode>
  );
});
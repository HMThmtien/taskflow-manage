import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "./require-auth";
import { AppShell } from "@/widgets/app-shell/app-shell";

import LoginPage from "@/pages/public/login";
import DashboardPage from "@/pages/app/dashboard";
import ProjectsPage from "@/pages/app/projects";
import ProjectDetailPage from "@/pages/app/project-detail";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <LoginPage /> },

  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:projectId", element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
]);

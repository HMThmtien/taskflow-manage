import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "./require-auth";
import { RequireAdmin } from "./require-admin";
import { AppShell } from "@/widgets/app-shell/app-shell";

import LoginPage from "@/pages/public/login";
import DashboardPage from "@/pages/app/dashboard";
import ProjectsPage from "@/pages/app/projects";
import ProjectDetailPage from "@/pages/app/project-detail";
import AdminUsersPage from "@/pages/app/admin/users";
import ActivityPage from "@/pages/app/activity";
import ReportsPage from "@/pages/app/reports";
import ProfilePage from "@/pages/app/profile";
import InboxPage from "@/pages/app/inbox";

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
          { path: 'inbox', element: <InboxPage /> },
          { path: 'activity', element: <ActivityPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'profile', element: <ProfilePage /> },

          // ✅ Admin routes
          {
            path: "admin",
            element: <RequireAdmin />,
            children: [
              { path: "users", element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
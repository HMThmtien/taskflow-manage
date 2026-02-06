import { http, HttpResponse, delay } from "msw";

type Project = {
  id: string;
  name: string;
  key: string; // TF, DEV...
  description?: string;
  createdAt: string;
};

let projects: Project[] = [
  {
    id: "p1",
    name: "TaskFlow Core",
    key: "TF",
    description: "Core project management features",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Marketing Site",
    key: "MKT",
    description: "Landing, pricing, SEO",
    createdAt: new Date().toISOString(),
  },
];

function maybeError() {
  return Math.random() < 0.01; // 5% lỗi để test UI
}

type IssueStatus = "todo" | "in_progress" | "done";
type Issue = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
};

let issues: Issue[] = [
  {
    id: "i1",
    projectId: "p1",
    title: "Setup routing + layout",
    description: "App shell with sidebar/topbar and guarded routes.",
    status: "done",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i2",
    projectId: "p1",
    title: "Projects CRUD with MSW",
    description: "List + create dialog + loading/empty/error UI.",
    status: "in_progress",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i3",
    projectId: "p1",
    title: "Kanban drag & drop",
    description: "Use dnd-kit with optimistic update.",
    status: "todo",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i4",
    projectId: "p2",
    title: "Landing page sections",
    description: "Hero, features, pricing blocks.",
    status: "todo",
    priority: "low",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const handlers = [
  http.get("/api/projects", async () => {
    await delay(400);
    if (maybeError()) {
      return HttpResponse.json({ message: "Random server error" }, { status: 500 });
    }
    return HttpResponse.json(projects);
  }),

  http.post("/api/projects", async ({ request }) => {
    await delay(400);
    if (maybeError()) {
      return HttpResponse.json({ message: "Cannot create project" }, { status: 500 });
    }

    const body = (await request.json()) as { name: string; key: string; description?: string };

    const newProject: Project = {
      id: `p_${Math.random().toString(16).slice(2)}`,
      name: body.name,
      key: body.key.toUpperCase(),
      description: body.description,
      createdAt: new Date().toISOString(),
    };

    projects = [newProject, ...projects];
    return HttpResponse.json(newProject, { status: 201 });
  }),
  http.get("/api/projects/:projectId/issues", async ({ params }) => {
    await delay(400);
    if (maybeError()) {
      return HttpResponse.json({ message: "Failed to load issues" }, { status: 500 });
    }
    const { projectId } = params as { projectId: string };
    return HttpResponse.json(issues.filter((i) => i.projectId === projectId));
  }),

  http.patch("/api/issues/:issueId", async ({ params, request }) => {
    await delay(350);
    if (maybeError()) {
      return HttpResponse.json({ message: "Failed to update issue" }, { status: 500 });
    }

    const { issueId } = params as { issueId: string };
    const body = (await request.json()) as {
        status?: IssueStatus;
        title?: string;
        description?: string;
      };
      
    const idx = issues.findIndex((i) => i.id === issueId);
    if (idx === -1) {
      return HttpResponse.json({ message: "Issue not found" }, { status: 404 });
    }
      
      issues[idx] = {
        ...issues[idx],
        status: body.status ?? issues[idx].status,
        title: body.title ?? issues[idx].title,
        description: body.description ?? issues[idx].description,
        updatedAt: new Date().toISOString(),
      };
      
    return HttpResponse.json(issues[idx]);
  }),

  http.get("/api/projects/:projectId", async ({ params }) => {
    await delay(250);
    const { projectId } = params as { projectId: string };
    const p = projects.find((x) => x.id === projectId);
    if (!p) return HttpResponse.json({ message: "Project not found" }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.post("/api/issues", async ({ request }) => {
    await delay(350);
    if (maybeError()) {
      return HttpResponse.json({ message: "Cannot create issue" }, { status: 500 });
    }
  
    const body = (await request.json()) as {
      projectId: string;
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high";
    };
  
    if (!body.title?.trim()) {
      return HttpResponse.json({ message: "Title is required" }, { status: 400 });
    }
  
    const newIssue: Issue = {
      id: `i_${Math.random().toString(16).slice(2)}`,
      projectId: body.projectId,
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      status: "todo",
      priority: body.priority ?? "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  
    issues = [newIssue, ...issues];
    return HttpResponse.json(newIssue, { status: 201 });
  }),
  
  
];

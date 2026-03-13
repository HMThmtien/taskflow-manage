import { authFetchJson } from "@/services/api/client";
import type { GlobalRole } from "@/features/admin-user/api/admin-users.api";
import type { IssuePriority, IssueStatus, IssueType } from "@/features/issues/api/issues.api";

export type SearchProjectResult = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  archived: boolean;
};

export type SearchIssueResult = {
  id: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
};

export type SearchUserResult = {
  id: string;
  username: string;
  fullName?: string | null;
  role: GlobalRole;
};

export type SearchResponse = {
  projects: SearchProjectResult[];
  issues: SearchIssueResult[];
  users: SearchUserResult[];
};

export function searchWorkspace(q: string, limit = 5) {
  const sp = new URLSearchParams();
  sp.set("q", q.trim());
  sp.set("limit", String(limit));

  return authFetchJson<SearchResponse>(`/api/search?${sp.toString()}`);
}

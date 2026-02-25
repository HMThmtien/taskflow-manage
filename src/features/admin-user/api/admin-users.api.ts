import { authFetchJson } from "@/services/api/client";

export type GlobalRole = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  username: string;
  role: GlobalRole;
  createdAt: string;
};

// Spring Page<T>
export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string } | null;
  timestamp: string;
};

export type ListAdminUsersParams = {
  q?: string;
  role?: GlobalRole;
  page?: number;
  size?: number;
  sort?: string; // "username,asc" | "createdAt,desc" ...
};

function buildSearchParams(params: ListAdminUsersParams) {
  const sp = new URLSearchParams();

  const q = params.q?.trim();
  if (q) sp.set("q", q);
  if (params.role) sp.set("role", params.role);

  sp.set("page", String(params.page ?? 0));
  sp.set("size", String(params.size ?? 20));

  if (params.sort) sp.set("sort", params.sort);

  return sp;
}

// GET /api/admin/users?q=&role=&page=&size=&sort=
export function getAdminUsers(params: ListAdminUsersParams = {}) {
  const sp = buildSearchParams(params);
  return authFetchJson<ApiResponse<Page<AdminUser>>>(`/api/admin/users?${sp.toString()}`);
}

// PATCH /api/admin/users/{username}/role?role=ADMIN|USER
export function changeUserRole(username: string, role: GlobalRole) {
  const sp = new URLSearchParams();
  sp.set("role", role);

  return authFetchJson<ApiResponse<null>>(
    `/api/admin/users/${encodeURIComponent(username)}/role?${sp.toString()}`,
    { method: "PATCH" }
  );
}
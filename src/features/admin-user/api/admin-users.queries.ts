import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUserRole,
  getAdminUsers,
  type GlobalRole,
  type ListAdminUsersParams,
} from "./admin-users.api";

export const adminUsersKeys = {
  all: ["admin-users"] as const,
  list: (params: ListAdminUsersParams) => [...adminUsersKeys.all, "list", params] as const,
};

export function useAdminUsersQuery(params: ListAdminUsersParams, enabled = true) {
  return useQuery({
    queryKey: adminUsersKeys.list(params),
    queryFn: async () => {
      const res = await getAdminUsers(params);
      return res.data; // ✅ Page<AdminUser>
    },
    enabled,
    staleTime: 10_000,
  });
}

// ✅ autocomplete: luôn sort theo username, limit 15
export function useAdminUsersAutocompleteQuery(q: string) {
  const enabled = q.trim().length > 0;

  return useAdminUsersQuery(
    {
      q,
      page: 0,
      size: 15,
      sort: "username,asc",
    },
    enabled
  );
}

export function useChangeUserRoleMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ username, role }: { username: string; role: GlobalRole }) =>
      changeUserRole(username, role),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}
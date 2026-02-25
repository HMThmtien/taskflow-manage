import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  getMyProjectRole,
  getProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectRole,
} from "./project-members.api";

export const projectMemberKeys = {
  all: ["project-members"] as const,
  project: (projectId: string) => [...projectMemberKeys.all, projectId] as const,
  list: (projectId: string) => [...projectMemberKeys.project(projectId), "list"] as const,
  me: (projectId: string) => [...projectMemberKeys.project(projectId), "me"] as const,
};

export function useProjectMembersQuery(projectId: string) {
  return useQuery({
    queryKey: projectMemberKeys.list(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useMyProjectRoleQuery(projectId: string) {
  return useQuery({
    queryKey: projectMemberKeys.me(projectId),
    queryFn: () => getMyProjectRole(projectId),
    enabled: !!projectId,
  });
}

export function useAddProjectMemberMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { username: string; role: ProjectRole }) => addProjectMember(projectId, payload),
    onSuccess: async () => {
      // ✅ invalidate theo prefix project, chắc chắn list+me đều refresh
      await qc.invalidateQueries({ queryKey: projectMemberKeys.project(projectId) });
    },
  });
}

export function useUpdateProjectMemberRoleMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; role: ProjectRole }) =>
      updateProjectMemberRole(projectId, payload.userId, { role: payload.role }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectMemberKeys.project(projectId) });
    },
  });
}

export function useRemoveProjectMemberMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectMemberKeys.project(projectId) });
    },
  });
}
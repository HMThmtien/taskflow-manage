import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  getMyProjectRole,
  getProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectRole,
} from "./project-members.api";

export const memberKeys = {
  all: ["projectMembers"] as const,
  project: (projectId: string) => [...memberKeys.all, projectId] as const,
  me: (projectId: string) => [...memberKeys.project(projectId), "me"] as const,
  list: (projectId: string) => [...memberKeys.project(projectId), "list"] as const,
};

export function useProjectMembersQuery(projectId: string) {
  return useQuery({
    queryKey: memberKeys.list(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useMyProjectRoleQuery(projectId: string) {
  return useQuery({
    queryKey: memberKeys.me(projectId),
    queryFn: () => getMyProjectRole(projectId),
    enabled: !!projectId,
  });
}

export function useAddProjectMemberMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { username: string; role: ProjectRole }) => addProjectMember(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.project(projectId) });
    },
  });
}

export function useUpdateProjectMemberRoleMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; role: ProjectRole }) =>
      updateProjectMemberRole(projectId, payload.userId, { role: payload.role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.project(projectId) });
    },
  });
}

export function useRemoveProjectMemberMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.project(projectId) });
    },
  });
}
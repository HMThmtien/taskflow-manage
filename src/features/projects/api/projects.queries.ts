import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjects } from "./projects.api";
import { getProject } from "./projects.api";

export const projectsKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectsKeys.all,
    queryFn: getProjects,
  });
}

export function useCreateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
    },
  });
}



export function useProjectQuery(projectId: string) {
  return useQuery({
    queryKey: projectsKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });
}





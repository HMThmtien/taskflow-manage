import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubtask, getSubtasks } from "./subtasks.api";

export function useSubtasksQuery(projectId: string, issueId: string) {
  return useQuery({
    queryKey: ["issues", "subtasks", projectId, issueId],
    queryFn: () => getSubtasks(projectId, issueId),
    enabled: !!projectId && !!issueId,
  });
}

export function useCreateSubtaskMutation(projectId: string, issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createSubtask>[2]) =>
      createSubtask(projectId, issueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues", "subtasks", projectId, issueId] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAttachment, getAttachments, uploadAttachment } from "./attachments.api";

export function useAttachmentsQuery(issueId: string) {
  return useQuery({
    queryKey: ["issues", "attachments", issueId],
    queryFn: () => getAttachments(issueId),
    enabled: !!issueId,
  });
}

export function useUploadAttachmentMutation(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAttachment(issueId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues", "attachments", issueId] });
    },
  });
}

export function useDeleteAttachmentMutation(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(issueId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues", "attachments", issueId] });
    },
  });
}
import { authFetchJson, authFetchResponse } from "@/services/api/client";

export type IssueAttachment = {
  id: string;
  issueId: string;
  uploadedBy: string;
  uploadedByUsername: string;
  fileName: string;
  fileType?: string | null;
  fileSize: number;
  storagePath: string;
  createdAt: string;
};

type ApiResponse<T> = {
  data?: T;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getAttachments(issueId: string) {
  const res = await authFetchJson<ApiResponse<IssueAttachment[]> | IssueAttachment[]>(
    `/api/issues/${issueId}/attachments`
  );
  return unwrap(res) ?? [];
}

export async function uploadAttachment(issueId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await authFetchJson<ApiResponse<IssueAttachment> | IssueAttachment>(
    `/api/issues/${issueId}/attachments`,
    {
      method: "POST",
      body: form,
    }
  );

  return unwrap(res);
}

export async function deleteAttachment(issueId: string, attachmentId: string) {
  const res = await authFetchJson<ApiResponse<{ message: string }> | { message: string }>(
    `/api/issues/${issueId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
    }
  );

  return unwrap(res);
}

export async function resolveAttachmentDownloadUrl(storagePath: string, baseUrl?: string) {
  const requestUrl = storagePath.startsWith("http")
    ? storagePath
    : `${baseUrl ?? ""}${storagePath}`;

  const res = await authFetchResponse(requestUrl, {
    method: "GET",
  });

  return res.url;
}

export async function downloadAttachmentBlob(storagePath: string, baseUrl?: string) {
  const requestUrl = storagePath.startsWith("http")
    ? storagePath
    : `${baseUrl ?? ""}${storagePath}`;

  const res = await authFetchResponse(requestUrl, {
    method: "GET",
  });

  return res.blob();
}

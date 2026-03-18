import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";
import { downloadAttachmentBlob } from "@/features/issues/api/attachments.api";
import { toast } from "@/hooks/use-toast";

export type IssueAttachment = {
  id: string;
  fileName: string;
  fileType?: string | null;
  fileSize: number;
  storagePath: string;
  uploadedByUsername: string;
  createdAt: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  items,
  baseUrl,
  onDelete,
  deletingId,
}: {
  items: IssueAttachment[];
  baseUrl?: string;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}) {
  const { t } = useI18n();

  const openAttachment = async (item: IssueAttachment) => {
    const popup = window.open("", "_blank");

    try {
      const blob = await downloadAttachmentBlob(item.storagePath, baseUrl);
      const objectUrl = URL.createObjectURL(blob);

      if (popup) {
        popup.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        return;
      }

      window.open(objectUrl, "_blank");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      popup?.close();
      toast({
        title: t("issue.failedLoadAttachments"),
        description: error instanceof Error ? error.message : "Request failed",
        variant: "destructive",
      });
    }
  };

  if (!items.length) {
    return <div className="text-sm text-muted-foreground">{t("issue.noAttachmentsYet")}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => void openAttachment(item)}
                className="break-all text-sm font-medium hover:underline"
              >
                {item.fileName}
              </button>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("issue.byLine", {
                  size: formatFileSize(item.fileSize),
                  user: item.uploadedByUsername,
                  date: new Date(item.createdAt).toLocaleString(),
                })}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              disabled={deletingId === item.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";

export function AttachmentUpload({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (file: File) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{t("issue.uploadAttachment")}</div>
          <div className="text-xs text-muted-foreground">{t("issue.attachmentHint")}</div>
        </div>

        <Button variant="outline" asChild disabled={disabled}>
          <label className="cursor-pointer">
            <Paperclip className="mr-2 h-4 w-4" />
            {t("issue.chooseFile")}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelect(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}

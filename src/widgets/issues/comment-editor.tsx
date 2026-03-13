import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/features/i18n/i18n";

export function CommentEditor({
  disabled,
  isSubmitting,
  onSubmit,
}: {
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: (content: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder={t("issue.writeComment")}
        disabled={disabled}
      />
      <Button
        disabled={disabled || !value.trim() || isSubmitting}
        onClick={async () => {
          const text = value.trim();
          if (!text) return;
          await onSubmit(text);
          setValue("");
        }}
      >
        {isSubmitting ? t("issue.posting") : t("issue.postComment")}
      </Button>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Write a comment… Use @username to mention"
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
        {isSubmitting ? "Posting..." : "Post comment"}
      </Button>
    </div>
  );
}
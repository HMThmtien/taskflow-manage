import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AttachmentUpload({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (file: File) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Upload attachment</div>
          <div className="text-xs text-muted-foreground">
            Images, logs, documents…
          </div>
        </div>

        <Button variant="outline" asChild disabled={disabled}>
          <label className="cursor-pointer">
            <Paperclip className="mr-2 h-4 w-4" />
            Choose file
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
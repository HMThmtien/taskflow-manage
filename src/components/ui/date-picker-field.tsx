import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function toDate(value?: string | null) {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

function toIsoDate(value?: Date) {
  if (!value) return "";
  return format(value, "yyyy-MM-dd");
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const selected = toDate(value);

  return (
    <Popover>
      <div className="flex items-center gap-2">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <span>{selected ? format(selected, "dd/MM/yyyy") : placeholder}</span>
            <CalendarIcon className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange("")}
            title="Clear date"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onChange(toIsoDate(d))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

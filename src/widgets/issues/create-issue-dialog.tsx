import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { useCreateIssueMutation } from "@/features/issues/api/issues.queries";
import { useState } from "react";
import { DatePickerField } from "@/components/ui/date-picker-field";

const schema = z.object({
  title: z.string().min(2, "Title tối thiểu 2 ký tự"),
  description: z.string().optional().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  type: z.enum(["TASK", "BUG", "STORY", "EPIC", "SUBTASK"]).optional().default("TASK"),
  assigneeId: z.string().optional().default(""),
  dueDate: z.string().optional().default(""),
  labels: z.array(z.string()).optional().default([]),
});

type FormValues = z.input<typeof schema>;

export function CreateIssueDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const createMut = useCreateIssueMutation(projectId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "TASK",
      assigneeId: "",
      dueDate: "",
      labels: [],
    },
  });

  const labels = form.watch("labels") ?? [];
  const [labelInput, setLabelInput] = useFormLabelInput();

  function resetForm() {
    form.reset({
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "TASK",
      assigneeId: "",
      dueDate: "",
      labels: [],
    });
    setLabelInput("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New issue</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await createMut.mutateAsync({
                  title: values.title.trim(),
                  description: values.description?.trim() || undefined,
                  priority: values.priority ?? "MEDIUM",
                  type: values.type ?? "TASK",
                  assigneeId: values.assigneeId || undefined,
                  dueDate: values.dueDate || undefined,
                  labels: values.labels ?? [],
                });

                toast({ title: "Issue created" });
                resetForm();
                onOpenChange(false);
              } catch (e: any) {
                toast({
                  title: "Create failed",
                  description: e?.message ?? "Unknown error",
                  variant: "destructive",
                });
              }
            })}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Implement drag & drop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value ?? "TASK"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TASK">Task</SelectItem>
                        <SelectItem value="BUG">Bug</SelectItem>
                        <SelectItem value="STORY">Story</SelectItem>
                        <SelectItem value="EPIC">Epic</SelectItem>
                        <SelectItem value="SUBTASK">Subtask</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value ?? "MEDIUM"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pick due date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

<div className="space-y-2">
  <label className="text-sm font-medium">Labels</label>

  <div className="flex gap-2">
    <Input
      value={labelInput}
      onChange={(e) => setLabelInput(e.target.value)}
      placeholder="Add label and press Enter"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const v = labelInput.trim();
          if (!v) return;
          form.setValue("labels", Array.from(new Set([...(labels ?? []), v])));
          setLabelInput("");
        }
      }}
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const v = labelInput.trim();
        if (!v) return;
        form.setValue("labels", Array.from(new Set([...(labels ?? []), v])));
        setLabelInput("");
      }}
    >
      Add
    </Button>
  </div>

  <div className="flex flex-wrap gap-2">
    {labels.map((lb) => (
      <Badge
        key={lb}
        className="cursor-pointer"
        onClick={() =>
          form.setValue(
            "labels",
            labels.filter((x) => x !== lb)
          )
        }
      >
        {lb}
      </Badge>
    ))}
  </div>
</div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Optional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Create issue"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function useFormLabelInput() {
  const [value, setValue] = useState("");
  return [value, setValue] as const;
}
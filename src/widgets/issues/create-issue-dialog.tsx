import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { useCreateIssueMutation } from "@/features/issues/api/issues.queries";

const schema = z.object({
  title: z.string().min(2, "Title tối thiểu 2 ký tự"),
  // input có thể undefined, output sẽ default thành ""
  description: z.string().optional().default(""),
  // input có thể undefined, output sẽ default thành "medium"
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

// ✅ QUAN TRỌNG: RHF làm việc với INPUT type (trước khi Zod apply default)
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
      priority: "medium",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset({ title: "", description: "", priority: "medium" });
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
                  // values.description có thể undefined theo input type
                  description: values.description?.trim() || undefined,
                  // values.priority có thể undefined theo input type
                  priority: values.priority ?? "medium",
                });

                toast({ title: "Issue created" });
                form.reset({ title: "", description: "", priority: "medium" });
                onOpenChange(false);
              } catch (e: any) {
                toast({ title: "Create failed", description: e?.message ?? "Unknown error" });
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

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value ?? "medium"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCreateProjectMutation, useProjectsQuery } from "@/features/projects/api/projects.queries";
import { Link } from "react-router-dom";


export default function ProjectsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useProjectsQuery();
  const createMut = useCreateProjectMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your projects.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Project</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Input placeholder="Name (e.g. TaskFlow Core)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Key (e.g. TF)" value={key} onChange={(e) => setKey(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

              <Button
                disabled={createMut.isPending || !name.trim() || key.trim().length < 2}
                onClick={async () => {
                  try {
                    await createMut.mutateAsync({
                      name: name.trim(),
                      key: key.trim().toUpperCase(),
                      description: description.trim() || undefined,
                    });

                    toast({ title: "Project created" });
                    setOpen(false);
                    setName("");
                    setKey("");
                    setDescription("");
                  } catch (e: any) {
                    toast({ title: "Create failed", description: e.message });
                  }
                }}
              >
                {createMut.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Failed to load projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">No projects yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Create your first project to start tracking issues.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.map((p) => (
            <Link key={p.id} to={`/app/projects/${p.id}`} className="block">
              <Card className="hover:bg-accent/40 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{p.key}</div>
                  {p.description ? (
                    <div className="mt-1 line-clamp-2">{p.description}</div>
                  ) : (
                    <div className="mt-1">No description</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

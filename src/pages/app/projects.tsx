import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCreateProjectMutation, useProjectsQuery } from "@/features/projects/api/projects.queries";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Search, RefreshCcw, ArrowUpDown } from "lucide-react";

type SortKey = "name" | "key" | "newest";

function makeKeyFromName(name: string) {
  // Lấy chữ cái đầu của mỗi từ, tối đa 4 ký tự, uppercase
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const k = parts.map((p) => p[0]).join("").slice(0, 4).toUpperCase();
  return k || "";
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } = useProjectsQuery();
  const createMut = useCreateProjectMutation();

  // UI states
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  // Form states
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [autoKey, setAutoKey] = useState(true);

  // Auto-generate key from name (optional)
  useEffect(() => {
    if (!autoKey) return;
    const next = makeKeyFromName(name);
    setKey(next);
  }, [name, autoKey]);

  const projects = data ?? [];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = projects;

    if (qq) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.key} ${p.description ?? ""}`.toLowerCase();
        return hay.includes(qq);
      });
    }

    const sorted = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "key") return a.key.localeCompare(b.key);
      // "newest": nếu backend có createdAt thì dùng; không có thì fallback theo id
      // @ts-ignore
      const aT = (a.createdAt ? new Date(a.createdAt).getTime() : 0) as number;
      // @ts-ignore
      const bT = (b.createdAt ? new Date(b.createdAt).getTime() : 0) as number;
      if (aT !== bT) return bT - aT;
      // fallback stable
      return String(b.id).localeCompare(String(a.id));
    });

    return sorted;
  }, [projects, q, sort]);

  const total = projects.length;
  const shown = filtered.length;

  const canCreate = name.trim().length >= 2 && key.trim().length >= 2 && !createMut.isPending;

  async function handleCreate() {
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
      setAutoKey(true);
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create, search, and manage your projects.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[680px]">
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Name</div>
                  <Input
                    placeholder="e.g. TaskFlow Core"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <div className="text-xs text-muted-foreground">A human-friendly project name.</div>
                </div>

                {/* Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground">Key</div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition"
                      onClick={() => setAutoKey((v) => !v)}
                      title="Toggle auto-generate key"
                    >
                      {autoKey ? "Auto" : "Manual"}
                    </button>
                  </div>

                  <Input
                    placeholder="e.g. TF"
                    value={key}
                    onChange={(e) => {
                      setAutoKey(false);
                      setKey(e.target.value);
                    }}
                    onBlur={() => setKey((v) => v.trim().toUpperCase())}
                  />
                  <div className="text-xs text-muted-foreground">
                    Short identifier (2+ chars). Used in issue codes.
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground">Description</div>
                  <Textarea
                    placeholder="What is this project about? (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[110px]"
                  />
                  <div className="text-xs text-muted-foreground">Keep it short; you can edit later.</div>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Preview: <span className="font-medium text-foreground">{key.trim().toUpperCase() || "KEY"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={createMut.isPending}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate}>
                      {createMut.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:max-w-[520px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, key, description…"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              title="Clear search"
              onClick={() => setQ("")}
              disabled={!q.trim()}
            >
              <span className="sr-only">Clear</span>
              <span className="text-sm">×</span>
            </Button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{shown}</span> / {total}
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setSort((s) => (s === "newest" ? "name" : s === "name" ? "key" : "newest"));
              }}
              title="Change sort"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sort === "newest" ? "Newest" : sort === "name" ? "Name" : "Key"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-56" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Failed to load projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{projects.length === 0 ? "No projects yet" : "No results"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {projects.length === 0
              ? "Create your first project to start tracking issues."
              : "Try a different search term or clear filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/app/projects/${p.id}`} className="block focus:outline-none">
              <Card className="shadow-sm transition hover:shadow-md hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-primary/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="truncate">{p.name}</span>
                      {p.archived ? (
                        <span className="text-[10px] font-medium text-muted-foreground rounded-md border px-2 py-0.5">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground rounded-md border px-2 py-0.5">
                      {p.key}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-sm text-muted-foreground">
                  {p.description ? (
                    <div className="line-clamp-2">{p.description}</div>
                  ) : (
                    <div className="italic">No description</div>
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

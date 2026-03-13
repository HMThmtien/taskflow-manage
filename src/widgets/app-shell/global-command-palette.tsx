import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useGlobalSearchQuery } from "@/features/search/api/search.queries";
import { useAuthStore } from "@/stores/auth.store";
import { FolderKanban, Loader2, Search, ShieldCheck, UserRound } from "lucide-react";
import { StatusPill } from "@/pages/app/status-pill";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";

function shortcutLabel() {
  return navigator.platform.toUpperCase().includes("MAC") ? "Cmd+K" : "Ctrl+K";
}

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.tokens?.role);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();

  const searchQ = useGlobalSearchQuery(trimmedQuery, 5, open);
  const results = searchQ.data;

  const totalResults = useMemo(() => {
    if (!results) return 0;
    const userCount = role === "ADMIN" ? results.users.length : 0;
    return results.projects.length + results.issues.length + userCount;
  }, [results, role]);

  useHotkeys((e) => {
    const isMetaShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
    if (!isMetaShortcut) return;
    e.preventDefault();
    startTransition(() => onOpenChange(!open));
  });

  function go(to: string) {
    onOpenChange(false);
    setQuery("");
    navigate(to);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search projects, issues, users..."
      />

      <CommandList>
        {!trimmedQuery ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Type to search across projects, issues, and users.
          </div>
        ) : null}

        {trimmedQuery && searchQ.isFetching ? (
          <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        ) : null}

        {trimmedQuery && !searchQ.isFetching ? (
          <CommandEmpty>No matches found.</CommandEmpty>
        ) : null}

        {results?.projects.length ? (
          <CommandGroup heading="Projects">
            {results.projects.map((project) => (
              <CommandItem
                key={project.id}
                value={`${project.key} ${project.name} ${project.description ?? ""}`}
                onSelect={() => go(`/app/projects/${project.id}`)}
              >
                <FolderKanban className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{project.name}</span>
                  <Badge variant="outline" className="shrink-0">{project.key}</Badge>
                  {project.archived ? <Badge variant="secondary">Archived</Badge> : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results?.projects.length && (results.issues.length || (role === "ADMIN" && results.users.length)) ? (
          <CommandSeparator />
        ) : null}

        {results?.issues.length ? (
          <CommandGroup heading="Issues">
            {results.issues.map((issue) => (
              <CommandItem
                key={issue.id}
                value={`${issue.projectKey} ${issue.projectName} ${issue.title}`}
                onSelect={() => go(`/app/projects/${issue.projectId}?tab=board&issueId=${issue.id}`)}
              >
                <Search className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{issue.title}</span>
                    <Badge variant="outline" className="shrink-0">{issue.projectKey}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{issue.projectName}</span>
                    <IssueTypeBadge type={issue.type} />
                    <StatusPill status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results?.issues.length && role === "ADMIN" && results.users.length ? <CommandSeparator /> : null}

        {role === "ADMIN" && results?.users.length ? (
          <CommandGroup heading="Users">
            {results.users.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.username} ${user.fullName ?? ""}`}
                onSelect={() => go(`/app/admin/users?q=${encodeURIComponent(user.username)}`)}
              >
                <UserRound className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{user.username}</span>
                  {user.fullName ? (
                    <span className="truncate text-xs text-muted-foreground">{user.fullName}</span>
                  ) : null}
                </div>
                <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>{user.role}</Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {!trimmedQuery ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Shortcuts">
              <CommandItem onSelect={() => go("/app/projects")}>
                <FolderKanban className="h-4 w-4" />
                <span className="flex-1">Open projects</span>
                <CommandShortcut>{shortcutLabel()}</CommandShortcut>
              </CommandItem>
              {role === "ADMIN" ? (
                <CommandItem onSelect={() => go("/app/admin/users")}>
                  <ShieldCheck className="h-4 w-4" />
                  <span className="flex-1">Open admin users</span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </>
        ) : null}

        {trimmedQuery && totalResults > 0 ? (
          <>
            <CommandSeparator />
            <div className="px-4 py-2 text-xs text-muted-foreground">
              {totalResults} result{totalResults === 1 ? "" : "s"} available
            </div>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

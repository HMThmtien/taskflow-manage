export type IssueFilters = {
    q?: string;
    status?: "TODO" | "IN_PROGRESS" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    assigneeId?: string;

    dueFrom?: string; // yyyy-mm-dd
    dueTo?: string;
  
    label?: string;
  };
  
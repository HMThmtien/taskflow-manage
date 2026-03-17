import { useQuery } from '@tanstack/react-query'
import {
  getProjectSprintProgressReport,
  getProjectSummaryReport,
  getProjectWorkloadReport,
  getWorkspaceReport,
} from './reports.api'

export const reportsKeys = {
  all: ['reports'] as const,
  workspace: (params?: { from?: string; to?: string; projectId?: string }) =>
    [...reportsKeys.all, 'workspace', params] as const,
  summary: (projectId: string) => [...reportsKeys.all, projectId, 'summary'] as const,
  workload: (projectId: string) => [...reportsKeys.all, projectId, 'workload'] as const,
  sprintProgress: (projectId: string) => [...reportsKeys.all, projectId, 'sprint-progress'] as const,
}

export function useWorkspaceReportQuery(params?: {
  from?: string
  to?: string
  projectId?: string
}) {
  return useQuery({
    queryKey: reportsKeys.workspace(params),
    queryFn: () => getWorkspaceReport(params),
  })
}

export function useProjectSummaryReportQuery(projectId?: string) {
  return useQuery({
    queryKey: reportsKeys.summary(projectId ?? ''),
    queryFn: () => getProjectSummaryReport(projectId ?? ''),
    enabled: !!projectId,
  })
}

export function useProjectWorkloadReportQuery(projectId?: string) {
  return useQuery({
    queryKey: reportsKeys.workload(projectId ?? ''),
    queryFn: () => getProjectWorkloadReport(projectId ?? ''),
    enabled: !!projectId,
  })
}

export function useProjectSprintProgressReportQuery(projectId?: string) {
  return useQuery({
    queryKey: reportsKeys.sprintProgress(projectId ?? ''),
    queryFn: () => getProjectSprintProgressReport(projectId ?? ''),
    enabled: !!projectId,
  })
}

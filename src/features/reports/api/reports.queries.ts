import { useQuery } from '@tanstack/react-query'
import { getWorkspaceReport } from './reports.api'

export function useWorkspaceReportQuery(params?: {
  from?: string
  to?: string
  projectId?: string
}) {
  return useQuery({
    queryKey: ['reports', 'workspace', params],
    queryFn: () => getWorkspaceReport(params),
  })
}

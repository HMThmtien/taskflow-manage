import { useQuery } from '@tanstack/react-query'
import { getActivity } from './activity.api'

export function useActivityQuery(params?: {
  q?: string
  projectId?: string
  actor?: string
  type?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: () => getActivity(params),
  })
}

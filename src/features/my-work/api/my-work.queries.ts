import { useQuery } from '@tanstack/react-query'
import { getMyWork } from './my-work.api'
import type { GetMyWorkParams } from '../types/my-work.types'

export function useMyWorkQuery(params: GetMyWorkParams) {
  return useQuery({
    queryKey: ['my-work', params],
    queryFn: () => getMyWork(params),
  })
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeMyPassword,
  getMyPreferences,
  getMyProfile,
  updateMyPreferences,
  updateMyProfile,
} from './profile.api'
import type {
  ChangeMyPasswordInput,
  UpdateMyPreferencesInput,
  UpdateMyProfileInput,
} from '../types/profile.types'

export const profileQueryKeys = {
  me: ['profile', 'me'] as const,
  preferences: ['profile', 'preferences'] as const,
}

export function useMyProfileQuery() {
  return useQuery({
    queryKey: profileQueryKeys.me,
    queryFn: getMyProfile,
  })
}

export function useMyPreferencesQuery() {
  return useQuery({
    queryKey: profileQueryKeys.preferences,
    queryFn: getMyPreferences,
  })
}

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateMyProfileInput) => updateMyProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(profileQueryKeys.me, data)
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.me })
    },
  })
}

export function useChangeMyPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangeMyPasswordInput) => changeMyPassword(payload),
  })
}

export function useUpdateMyPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateMyPreferencesInput) =>
      updateMyPreferences(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(profileQueryKeys.preferences, data)
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.preferences })
    },
  })
}
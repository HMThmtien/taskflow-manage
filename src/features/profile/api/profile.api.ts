import { authFetchJson } from "@/services/api/client";
import type {
  ChangeMyPasswordInput,
  UpdateMyPreferencesInput,
  UpdateMyProfileInput,
  UserPreferences,
  UserProfile,
} from "../types/profile.types";

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getMyProfile() {
  const res = await authFetchJson<ApiResponse<UserProfile> | UserProfile>(
    "/api/users/me"
  );
  return unwrap(res);
}

export async function updateMyProfile(payload: UpdateMyProfileInput) {
  const res = await authFetchJson<ApiResponse<UserProfile> | UserProfile>(
    "/api/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return unwrap(res);
}

export async function changeMyPassword(payload: ChangeMyPasswordInput) {
  const res = await authFetchJson<
    ApiResponse<{ message: string }> | { message: string }
  >("/api/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return unwrap(res);
}

export async function getMyPreferences() {
  const res = await authFetchJson<
    ApiResponse<UserPreferences> | UserPreferences
  >("/api/users/me/preferences");

  return unwrap(res);
}

export async function updateMyPreferences(payload: UpdateMyPreferencesInput) {
  const res = await authFetchJson<
    ApiResponse<UserPreferences> | UserPreferences
  >("/api/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return unwrap(res);
}
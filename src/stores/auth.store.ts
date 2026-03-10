import { create } from "zustand";
import { fetchJson } from "@/services/api/client";

type Tokens = {
  accessToken: string;
  refreshToken: string;
  username?: string;
  role?: string;
};

type AuthState = {
  tokens: Tokens | null;
  login: (payload: { username: string; password: string }) => Promise<void>;
  register: (payload: { username: string; password: string }) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
  isAuthed: () => boolean;
};

const TOKENS_KEY = "taskflow_tokens";

export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: localStorage.getItem(TOKENS_KEY)
    ? (JSON.parse(localStorage.getItem(TOKENS_KEY) as string) as Tokens)
    : null,

  isAuthed: () => !!get().tokens?.accessToken,

  login: async ({ username, password }) => {
    const res = await fetchJson<{ data: Tokens }>(`/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const tokens = res.data;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    set({ tokens });
  },

  // ✅ thêm register
  register: async ({ username, password }) => {
    const res = await fetchJson<{ data: Tokens }>(`/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const tokens = res.data;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    set({ tokens });
  },

  loadMe: async () => {
    const tokens = get().tokens;
    if (!tokens?.accessToken) return;

    try {
      const res = await fetchJson<{
        data: { id: string; username: string; role: string };
      }>(`/api/auth/me`);

      const updated: Tokens = {
        ...tokens,
        username: res.data.username,
        role: res.data.role,
      };

      localStorage.setItem(TOKENS_KEY, JSON.stringify(updated));
      set({ tokens: updated });
    } catch {
      // token hết hạn → logout
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem(TOKENS_KEY);
    set({ tokens: null });
  },
}));
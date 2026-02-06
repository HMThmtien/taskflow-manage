import { create } from "zustand";

type User = { id: string; name: string; email: string };

type AuthState = {
  token: string | null;
  user: User | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("taskflow_token"),
  user: localStorage.getItem("taskflow_user")
    ? JSON.parse(localStorage.getItem("taskflow_user") as string)
    : null,

  login: async ({ email }) => {
    // mock login delay
    await new Promise((r) => setTimeout(r, 400));

    const token = "mock_token";
    const user = { id: "u1", name: "Kim Hoo", email };

    localStorage.setItem("taskflow_token", token);
    localStorage.setItem("taskflow_user", JSON.stringify(user));

    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
    set({ token: null, user: null });
  },
}));

type Tokens = {
    accessToken: string;
    refreshToken: string;
    username?: string;
    role?: string;
  };
  
  let isRefreshing = false;
  let refreshPromise: Promise<Tokens> | null = null;
  
  export function getTokens(): Tokens | null {
    const raw = localStorage.getItem("taskflow.tokens");
    return raw ? (JSON.parse(raw) as Tokens) : null;
  }
  
  export function setTokens(tokens: Tokens) {
    localStorage.setItem("taskflow.tokens", JSON.stringify(tokens));
  }
  
  export function clearTokens() {
    localStorage.removeItem("taskflow.tokens");
  }
  
  async function refreshTokens(baseUrl: string): Promise<Tokens> {
    const tokens = getTokens();
    if (!tokens?.refreshToken) throw new Error("No refresh token");
  
    const url = `${baseUrl}/api/auth/refresh?refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
  
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) throw new Error("Refresh failed");
  
    const data = await res.json();
  
    // Nếu backend của bạn wrap ApiResponse {data: {...}}
    const payload = data.data ?? data;
  
    const next: Tokens = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      username: payload.username,
      role: payload.role,
    };
  
    setTokens(next);
    return next;
  }
  
  export async function authFetchJson<T>(
    baseUrl: string,
    input: RequestInfo,
    init: RequestInit = {}
  ): Promise<T> {
    const tokens = getTokens();
  
    const doFetch = async () => {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      if (tokens?.accessToken) headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  
      return fetch(input, { ...init, headers });
    };
  
    let res = await doFetch();
  
    // Nếu access token hết hạn
    if (res.status === 401) {
      // chống refresh spam
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshTokens(baseUrl).finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }
      await refreshPromise;
  
      // retry request với token mới
      const newTokens = getTokens();
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      if (newTokens?.accessToken) headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
  
      res = await fetch(input, { ...init, headers });
    }
  
    if (!res.ok) {
      let message = "Request failed";
      try {
        const data = await res.json();
        message = data?.message ?? data?.error?.message ?? message;
      } catch {}
      throw new Error(message);
    }
  
    return (await res.json()) as T;
  }
type Tokens = {
  accessToken: string;
  refreshToken: string;
  username?: string;
  role?: string;
};

const TOKENS_KEY = "taskflow_tokens";

function getTokens(): Tokens | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

function setTokens(tokens: Tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

let refreshInFlight: Promise<Tokens> | null = null;

async function refreshTokens(): Promise<Tokens> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) throw new Error("No refresh token");

  const res = await fetch(`/api/auth/refresh?refreshToken=${encodeURIComponent(tokens.refreshToken)}`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();
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

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.message ?? data?.error?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function authFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const doFetch = async () => {
    const tokens = getTokens();
    const headers = {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    };

    return fetch(input, { ...init, headers });
  };

  let res = await doFetch();

  // Access token hết hạn -> refresh -> retry 1 lần
  if (res.status === 401) {
    if (!refreshInFlight) {
      refreshInFlight = refreshTokens().finally(() => {
        refreshInFlight = null;
      });
    }
    await refreshInFlight;

    res = await doFetch();
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.message ?? data?.error?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
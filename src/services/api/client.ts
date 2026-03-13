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

  const res = await fetch(
    `/api/auth/refresh?refreshToken=${encodeURIComponent(tokens.refreshToken)}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) throw new Error("Refresh failed");

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  const payload = data?.data ?? data;

  const next: Tokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    username: payload.username,
    role: payload.role,
  };

  setTokens(next);
  return next;
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = buildHeaders(init);

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.message ?? data?.error?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return parseBody<T>(res);
}

export async function authFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const doFetch = async () => {
    const tokens = getTokens();
    const headers = new Headers(buildHeaders(init));

    if (tokens?.accessToken) {
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
    }

    return fetch(input, { ...init, headers });
  };

  let res = await doFetch();

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

  return parseBody<T>(res);
}

export function openAuthEventStream(
  input: RequestInfo,
  handlers: {
    onEvent: (event: string, data: unknown) => void;
    onError?: (error: Error) => void;
    onOpen?: () => void;
  }
) {
  const controller = new AbortController();

  void (async () => {
    const doFetch = async () => {
      const tokens = getTokens();
      const headers = new Headers();
      headers.set("Accept", "text/event-stream");

      if (tokens?.accessToken) {
        headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      }

      return fetch(input, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
    };

    try {
      let res = await doFetch();

      if (res.status === 401) {
        if (!refreshInFlight) {
          refreshInFlight = refreshTokens().finally(() => {
            refreshInFlight = null;
          });
        }

        await refreshInFlight;
        res = await doFetch();
      }

      if (!res.ok || !res.body) {
        throw new Error("Realtime connection failed");
      }

      handlers.onOpen?.();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          throw new Error("Realtime connection closed");
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        let splitIndex = buffer.indexOf("\n\n");
        while (splitIndex >= 0) {
          const chunk = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);

          let eventName = "message";
          const dataLines: string[] = [];

          for (const line of chunk.split("\n")) {
            if (!line || line.startsWith(":")) continue;
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
              continue;
            }
            if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length > 0) {
            const raw = dataLines.join("\n");
            const parsed = raw ? JSON.parse(raw) : null;
            handlers.onEvent(eventName, parsed);
          }

          splitIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      handlers.onError?.(error instanceof Error ? error : new Error("Realtime stream failed"));
    }
  })();

  return () => controller.abort();
}

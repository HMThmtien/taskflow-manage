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
        message = data?.message ?? message;
      } catch {}
      throw new Error(message);
    }
  
    return res.json() as Promise<T>;
  }
  
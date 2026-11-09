const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3000";
const TOKEN_KEY = "northstar.session";

// Only the session token is kept in the browser so you stay signed in.
// Every number you enter lives in the database, so any device sees the same data.
let token: string | null = localStorage.getItem(TOKEN_KEY);
const unauthorizedListeners = new Set<() => void>();
const slowListeners = new Set<(slow: boolean) => void>();
let inFlightSlow = 0;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

export const hasToken = () => Boolean(token);
export function onUnauthorized(fn: () => void) {
  unauthorizedListeners.add(fn);
  return () => {
    unauthorizedListeners.delete(fn);
  };
}

export function onSlow(fn: (slow: boolean) => void) {
  slowListeners.add(fn);
  return () => {
    slowListeners.delete(fn);
  };
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function request<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  // Free hosting tiers sleep when idle; tell the person if a request is waiting on a cold start.
  let markedSlow = false;
  const timer = window.setTimeout(() => {
    markedSlow = true;
    if (inFlightSlow++ === 0) slowListeners.forEach((fn) => fn(true));
  }, 2500);

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && token) {
      setToken(null);
      unauthorizedListeners.forEach((fn) => fn());
    }
    if (response.status === 204) return undefined as T;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || (Array.isArray(data.errors) ? data.errors.join(". ") : null) || `Request failed (${response.status})`;
      throw new ApiError(response.status, message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  } finally {
    window.clearTimeout(timer);
    if (markedSlow && --inFlightSlow === 0) slowListeners.forEach((fn) => fn(false));
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, "POST", body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>(path, "PATCH", body ?? {}),
  del: (path: string) => request<void>(path, "DELETE"),
};

/**
 * API client for Caixa Central.
 * The API is the source of truth; localStorage should only be used for UI
 * preferences or an explicit offline cache, never as the primary database.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("caixa-central:access-token");
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("caixa-central:access-token", token);
  else window.localStorage.removeItem("caixa-central:access-token");
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se o backend está em execução.", 0);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  const data = body ? (() => { try { return JSON.parse(body) as unknown; } catch { return body; } })() : null;
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in data
      ? String((data as { message: unknown }).message)
      : typeof data === "string" && data ? data : `A API retornou HTTP ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiRequest<void>(path, { method: "DELETE" }),
};

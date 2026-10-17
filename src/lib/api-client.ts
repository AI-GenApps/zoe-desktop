import { loadSessionToken } from "@/lib/secure-storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadSessionToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string | { code?: string; message?: string };
    };
    const detail = typeof body.error === "string" ? body.error : body.error?.message;
    const code = typeof body.error === "object" ? body.error.code : undefined;
    throw new ApiError(detail ?? response.statusText, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

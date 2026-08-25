export class ApiError extends Error {
  status: number;
  // The parsed JSON error body, when the server sent one — lets callers
  // branch on a specific flag (e.g. `wrongSchool`, `deviceMismatch`) rather
  // than matching on the human-readable message text, which is fragile and
  // can legitimately change wording over time.
  body: Record<string, unknown> | null;
  constructor(message: string, status: number, body: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (body && typeof body === "object" && "error" in body ? (body as { error: string }).error : null) || res.statusText || "Something went wrong.";
    throw new ApiError(message, res.status, body && typeof body === "object" ? (body as Record<string, unknown>) : null);
  }
  return body as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T,>(path: string, data?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T,>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

// Centralised, typed API client (Frontend PRD §7).
// Adds base URL, sends auth cookies, and normalises errors so the UI
// can map them consistently to toasts / inline messages.

import { getAccessToken, clearTokens } from "@/lib/utils/token-storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string; // Optional access token for authenticated requests
}

/**
 * A 401 on a request that WAS carrying a token means the session died
 * server-side (expired/revoked) — force a logout instead of letting every
 * page render the raw "Invalid or expired token" error inline. A 401 with no
 * token (e.g. a bad-credentials login attempt) is left alone.
 */
function handleUnauthorized(status: number, hadToken: boolean) {
  if (status !== 401 || !hadToken) return;
  clearTokens();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, token, ...rest } = options;

  // Use provided token or get from localStorage
  const accessToken = token ?? getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include", // send httpOnly session cookie
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const data = await res.json();
      message = data?.message ?? message;
      details = data;
    } catch {
      // non-JSON error body — keep statusText
    }
    handleUnauthorized(res.status, !!accessToken);
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * multipart/form-data upload — bypasses apiFetch's JSON-stringify body
 * handling entirely. Do not set Content-Type manually: the browser needs to
 * add its own multipart boundary.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const accessToken = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const data = await res.json();
      message = data?.message ?? message;
      details = data;
    } catch {
      // non-JSON error body — keep statusText
    }
    handleUnauthorized(res.status, !!accessToken);
    throw new ApiError(res.status, message, details);
  }

  return (await res.json()) as T;
}

/**
 * API client with axios-like interface
 * Wraps apiFetch to provide a familiar API
 */
export const apiClient = {
  get: async <T>(url: string, options?: { params?: Record<string, unknown> }) => {
    const queryString = options?.params
      ? "?" + new URLSearchParams(
          Object.entries(options.params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : "";
    
    const data = await apiFetch<T>(url + queryString, { method: "GET" });
    return { data };
  },

  post: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "POST",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  patch: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "PATCH",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  put: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "PUT",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  delete: async <T>(url: string, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "DELETE",
      ...options,
    });
    return { data: responseData };
  },
};

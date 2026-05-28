/**
 * H.A.L. Console — API Client Foundation
 * 
 * This is the single place all communication with the backend should happen.
 * 
 * Future enhancement: Integrate openapi-typescript generated types here.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/v1';

interface RequestOptions extends RequestInit {
  apiKey?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.apiKey ? { 'X-API-Key': options.apiKey } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  // Add put, delete, etc. as needed
};

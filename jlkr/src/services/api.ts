const BASE = import.meta.env.VITE_GATEKEEPER_URL;

export class AuthError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'AuthError';
  }
}

async function handleResponse<T>(res: Response, path: string): Promise<T> {
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  return handleResponse<T>(res, path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res, path);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<T>(res, path);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res, path);
}

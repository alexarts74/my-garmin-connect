import { API_BASE_URL } from '@/constants/config';
import { clearTokens, saveTokens } from '@/lib/token-storage';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  console.log('[api] fetch', url);
  let res: Response;
  try {
    res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    });
  } catch (err) {
    throw new ApiError(0, `Network error fetching ${url}: ${err instanceof Error ? err.message : err}`);
  }

  // Sync refreshed tokens from server
  const freshTokensHeader = res.headers.get('X-Garmin-Tokens');
  if (freshTokensHeader) {
    try {
      const freshTokens = JSON.parse(freshTokensHeader);
      await saveTokens(freshTokens);
    } catch {
      // Ignore parse errors
    }
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(res.status, `Server returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      await clearTokens();
      onUnauthorized?.();
    }
    throw new ApiError(res.status, data.error || 'Request failed');
  }

  return data as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

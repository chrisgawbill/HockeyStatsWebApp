/**
 * The one frontend HTTP/configuration boundary. Feature slices own endpoint
 * functions under `features/<feature>/api/`; they use these helpers and return
 * transport DTOs. Feature mappers then turn DTOs into UI/domain models.
 */

export const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:9000' : undefined);
const REQUEST_TIMEOUT_MS = 15_000;

if (!apiBaseUrl && import.meta.env.PROD) {
  console.error(
    'VITE_API_URL is not configured. API requests will use relative URLs.',
  );
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type RequestOptions = { headers?: HeadersInit };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    statusText: string,
  ) {
    super(`API request failed: ${status} ${statusText}`.trim());
    this.name = 'ApiError';
  }
}

/**
 * Keeps query values out of feature URL construction. Optional values are not
 * emitted, matching the previous client behavior.
 */
function urlFor(path: string, params?: QueryParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const url = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    : path;
  const serialized = query.toString();
  return serialized
    ? `${url}${url.includes('?') ? '&' : '?'}${serialized}`
    : url;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  data?: unknown,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(options?.headers);
  const body =
    data === undefined
      ? undefined
      : typeof data === 'string'
        ? data
        : JSON.stringify(data);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(urlFor(path, params), {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(response.status, response.statusText);

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Shared GET wrapper. Feature callers retain ownership of user-facing error UI.
 */
export function get<T>(
  path: string,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<T> {
  return request<T>('GET', path, undefined, params, options);
}

/**
 * Shared POST wrapper: returns `response.data`, and logs then re-throws so
 * callers keep their own error UI.
 */
export function post<T>(
  path: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>('POST', path, data, undefined, options);
}

/**
 * Shared PUT wrapper: returns `response.data`, and logs then re-throws so
 * callers keep their own error UI.
 */
export function put<T>(
  path: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>('PUT', path, data, undefined, options);
}

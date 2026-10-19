/**
 * The one frontend HTTP/configuration boundary. Feature slices own endpoint
 * functions under `features/<feature>/api/`; they use these helpers and return
 * transport DTOs. Feature mappers then turn DTOs into UI/domain models.
 */

export const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:9000' : undefined);
/** Configured API origin ('' when requests use relative URLs). */
export function getApiBaseUrl(): string {
  return (apiBaseUrl ?? '').replace(/\/+$/, '');
}

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * The deployed API sleeps when idle and takes up to about a minute to wake, so
 * the first requests after a quiet period time out or come back as gateway
 * errors. GETs are idempotent, so they retry those transient failures with
 * backoff instead of surfacing an error the user has to retry by hand. The
 * per-attempt timeout plus these delays gives the API roughly 70s to wake.
 */
const GET_RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Network failures and timeouts have no status and are worth retrying; HTTP
 * errors are retried only for statuses that signal a waking or overloaded API.
 */
function isTransient(error: unknown): boolean {
  return !(error instanceof ApiError) || RETRYABLE_STATUSES.has(error.status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs one request, retrying transient failures after each delay in
 * `retryDelays`. Logs only the final failure, then re-throws so callers keep
 * their own error UI.
 */
async function send<T>(
  attempt: () => Promise<T>,
  retryDelays: readonly number[] = [],
): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await attempt();
    } catch (error) {
      if (i >= retryDelays.length || !isTransient(error)) {
        console.error('API request failed:', error);
        throw error;
      }
      await delay(retryDelays[i]);
    }
  }
}

/**
 * Shared GET wrapper. Retries transient failures (see GET_RETRY_DELAYS_MS);
 * feature callers retain ownership of user-facing error UI.
 */
export function get<T>(
  path: string,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<T> {
  return send(
    () => request<T>('GET', path, undefined, params, options),
    GET_RETRY_DELAYS_MS,
  );
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
  return send(() => request<T>('POST', path, data, undefined, options));
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
  return send(() => request<T>('PUT', path, data, undefined, options));
}

/**
 * Shared DELETE wrapper: returns `response.data`, and logs then re-throws so
 * callers keep their own error UI. `data` is an optional JSON body.
 */
export function del<T>(
  path: string,
  options?: RequestOptions,
  data?: unknown,
): Promise<T> {
  return send(() => request<T>('DELETE', path, data, undefined, options));
}

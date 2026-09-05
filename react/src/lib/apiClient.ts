import { AxiosRequestConfig } from 'axios';
import { axiosExpressHandler } from '@/lib/axiosInstance';

/**
 * Shared HTTP core for the frontend API layer. Feature slices own their own
 * endpoint functions under `features/<feature>/api/`; each issues a GET through
 * this `get` helper, returns `response.data`, and logs then re-throws on failure
 * so callers can surface their own loading/empty states. Season-aware calls take
 * an optional `season` and thread it through `withParams`.
 */

export const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

/**
 * Appends only the defined params to `path` as a query string (empty/undefined
 * values are dropped), so `?season=` etc. is added only when actually set.
 */
export function withParams(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Shared GET wrapper: applies `withParams` when params are given, returns
 * `response.data`, and logs then re-throws so callers keep their own error UI.
 */
export async function get<T = any>(
  path: string,
  params?: Record<string, string | undefined>,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const url = params ? withParams(path, params) : path;
    const response = await axiosExpressHandler.get<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching data: ', error);
    throw error;
  }
}

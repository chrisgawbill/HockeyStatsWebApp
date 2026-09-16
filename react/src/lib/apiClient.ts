import axios, { AxiosRequestConfig } from 'axios';

/**
 * The one frontend HTTP/configuration boundary. Feature slices own endpoint
 * functions under `features/<feature>/api/`; they use these helpers and return
 * transport DTOs. Feature mappers then turn DTOs into UI/domain models.
 */

export const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:9000' : undefined);

if (!apiBaseUrl && import.meta.env.PROD) {
  console.error(
    'VITE_API_URL is not configured. API requests will use relative URLs.',
  );
}

const apiHttp = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  timeout: 15000,
});

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Keeps query values out of feature URL construction. Axios omits null and
 * undefined values when serializing, so optional parameters are not emitted.
 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiHttp.request<T>(config);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

function cleanQueryParams(params?: QueryParams): QueryParams | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
}

/**
 * Shared GET wrapper. Feature callers retain ownership of user-facing error UI.
 */
export function get<T>(
  path: string,
  params?: QueryParams,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({
    ...config,
    method: 'get',
    url: path,
    params: cleanQueryParams(params),
  });
}

/**
 * Shared POST wrapper: returns `response.data`, and logs then re-throws so
 * callers keep their own error UI.
 */
export function post<T>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: 'post', url: path, data });
}

/**
 * Shared PUT wrapper: returns `response.data`, and logs then re-throws so
 * callers keep their own error UI.
 */
export function put<T>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: 'put', url: path, data });
}

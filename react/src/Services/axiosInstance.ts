import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:9000' : undefined);

if (!apiBaseUrl && import.meta.env.PROD) {
  console.error(
    'VITE_API_URL is not configured. API requests will use relative URLs.',
  );
}

export const axiosExpressHandler = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
});

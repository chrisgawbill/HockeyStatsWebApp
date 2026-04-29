import axios from "axios";

export const axiosExpressHandler = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:9000",
  headers: {'Access-Control-Allow-Headers ' : '*'},
  withCredentials: false
});
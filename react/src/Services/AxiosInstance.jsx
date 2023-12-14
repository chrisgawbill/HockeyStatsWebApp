import axios from "axios";

export const axiosExpressHandler = axios.create({
  baseURL: "http://localhost:9000",
  headers: {'Access-Control-Allow-Headers ' : '*'},
  withCredentials: false
});
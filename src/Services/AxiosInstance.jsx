import axios from "axios";

export const axiosNhl = axios.create({
  baseURL: "https://statsapi.web.nhl.com/api/v1",
});
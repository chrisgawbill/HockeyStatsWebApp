import { axiosNhl } from "./AxiosInstance"
export const getStandings = () => {
    return axiosNhl.get("/standings");
}
export const getStandingsByConference = () => {
    return axiosNhl.get("/standings/byConference");
}
export const getStandingsByLeague = () => {
    return axiosNhl.get("/standings/byLeague");
}
export const getDraft = () => {
    return axiosNhl.get("/draft")
}
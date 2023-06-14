import { axiosNhl } from "./AxiosInstance"
export const getStandings = () => {
    return axiosNhl.get("/standings");
}
export const getStandingsbyConference = () => {
    return axiosNhl.get("/standings/byConference");
}
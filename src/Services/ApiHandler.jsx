import { axiosExpressHandler } from "./AxiosInstance"
export const GetCurrentStandings = () => {
    return axiosExpressHandler.get("/standings");
}
export const GetDraft = () => {
    // return axiosNhl.get("/draft")
}
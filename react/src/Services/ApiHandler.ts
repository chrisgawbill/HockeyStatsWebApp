import { axiosExpressHandler } from "./AxiosInstance"
export function GetCurrentStandings(){
    return axiosExpressHandler.get("/standings");
}
export function GetSkaterStatLeaders(statIndicator:string){
    return axiosExpressHandler.get("/player/skater/statLeaders/"+ statIndicator);
}
export function GetGoalieStatLeaders(statIndicator:string){
    return axiosExpressHandler.get("/player/goalie/statLeaders/" + statIndicator);
}
export function GetDraft(){
    // return axiosNhl.get("/draft")
}
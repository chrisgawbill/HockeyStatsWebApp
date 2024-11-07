import { axiosExpressHandler } from "./AxiosInstance"
export function GetCurrentStandings(){
    const data = axiosExpressHandler.get("/standings");
    return data;
}
export function GetSkaterStatLeaders(statIndicator:string){
    return axiosExpressHandler.get("/player/skater/statLeaders/"+ statIndicator);
}
export function GetGoalieStatLeaders(statIndicator:string){
    return axiosExpressHandler.get("/player/goalie/statLeaders/" + statIndicator);
}
export function GetListOfTeams(){
    return axiosExpressHandler.get("/team/")
}
export function GetTeamStatsById(teamId:string){
    return axiosExpressHandler.get("/team/" + teamId);
}
export function GetDraft(){
    // return axiosNhl.get("/draft")
}
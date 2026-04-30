import { axiosExpressHandler } from "./AxiosInstance"
export async function GetCurrentStandings(){
    try{
        const response =  await axiosExpressHandler.get("/standings");
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetSkaterStatLeaders(statIndicator:string){
    try{
        const response = await axiosExpressHandler.get("/player/skater/statLeaders/"+ statIndicator);
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetGoalieStatLeaders(statIndicator:string){
    try{
        const response =  await axiosExpressHandler.get("/player/goalie/statLeaders/" + statIndicator);
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetListOfTeams(){
    try{
        const response = await axiosExpressHandler.get("/team/");
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetTeamStatsById(teamId:string){
    try{
        const response = await axiosExpressHandler.get("/team/" + teamId);
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetScheduledGames(){
    try{
        const response = await axiosExpressHandler.get("/schedule/");
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetGameDetails(gameID:number){
    try{
        const response = await axiosExpressHandler.get(`/schedule/${gameID}`);
        return response.data;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
export async function GetTeamRoster(triCode: string) {
    try{
        const response = await axiosExpressHandler.get(`/team/roster/${triCode}`);
        return response.data;
    }catch(error){
        console.error("Error fetching team roster: ", error);
        throw error;
    }
}
export async function GetTeamSchedule(triCode: string) {
    try{
        const response = await axiosExpressHandler.get(`/team/schedule/${triCode}`);
        return response.data;
    }catch(error){
        console.error("Error fetching team schedule: ", error);
        throw error;
    }
}
export async function GetSkaterSummary(teamId?: string) {
    try{
        const url = teamId ? `/player/skater/summary?teamId=${teamId}` : "/player/skater/summary";
        const response = await axiosExpressHandler.get(url);
        return response.data;
    }catch(error){
        console.error("Error fetching skater summary: ", error);
        throw error;
    }
}
export async function GetSkaterCorsi(teamId?: string) {
    try{
        const url = teamId ? `/player/skater/corsi?teamId=${teamId}` : "/player/skater/corsi";
        const response = await axiosExpressHandler.get(url);
        return response.data;
    }catch(error){
        console.error("Error fetching skater corsi: ", error);
        throw error;
    }
}
export async function GetGoalieSummary(teamId?: string) {
    try{
        const url = teamId ? `/player/goalie/summary?teamId=${teamId}` : "/player/goalie/summary";
        const response = await axiosExpressHandler.get(url);
        return response.data;
    }catch(error){
        console.error("Error fetching goalie summary: ", error);
        throw error;
    }
}
export async function GetDraft(){
    // return axiosNhl.get("/draft")
}
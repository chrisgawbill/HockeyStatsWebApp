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
export async function GetDraft(){
    // return axiosNhl.get("/draft")
}
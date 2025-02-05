import { json } from "stream/consumers";
import { axiosExpressHandler } from "./AxiosInstance"

export async function InterfaceWithChatBot(message:object){
    try{
        const serializedMessage = JSON.stringify(message);
        const response = await axiosExpressHandler.post("/python-service", serializedMessage, {
            headers:{
                'Content-Type':'application/json'
            }
        })
        const data = response.data;
        let cleanedJsonString = data.trim().replace(/^\s*```json\s*/, '').replace(/\s*```\s*$/, '');
        const jsonData = JSON.parse(cleanedJsonString);
        return jsonData;
    }catch(error){
        console.error("Error fetching data: ", error);
        throw error;
    }
}
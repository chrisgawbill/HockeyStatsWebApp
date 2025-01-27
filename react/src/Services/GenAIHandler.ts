import { axiosExpressHandler } from "./AxiosInstance"

export function InterfaceWithChatBot(message:String){
    return axiosExpressHandler.get("/python-service/"+ "Give me a summary of the Philadelphia Flyers history. Break it up into 5 segments, each segment can at max be 300 words. Also give me this in a JSON format");
}
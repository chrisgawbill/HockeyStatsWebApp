import { axiosExpressHandler } from "./AxiosInstance"

export function InterfaceWithChatBot(message:String){
    return axiosExpressHandler.get("/python-service/"+ message);
}
import { ResponseData } from "../utils/ResponseData.ts";


export default interface INotificationService{
    sendNotification(payload:any):Promise<ResponseData>;
}
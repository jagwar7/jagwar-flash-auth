import { NotificationType } from "../utils/NotificationType.ts";
import { PayloadType } from "../utils/PayloadType.ts";


export class EmailNotificationData{
    email:string;
    phone:string;
    payloadType:PayloadType;
    userName: string;
    welcomeLink:string;

    constructor(email: string, phone:string,  userName: string, welcomeLink:string){
        this.email = email;
        this.phone = phone;
        this.userName = userName;
        this.welcomeLink = welcomeLink;
    }
}
import INotificationService from "../Interface/INotificationService.ts";
import welcome_mail_object from "../templates/welcome_letter.js";
import { NotificationType } from "../utils/NotificationType.ts";
import { PayloadType } from "../utils/PayloadType.ts";
import { ResponseData } from "../utils/ResponseData.ts";
import { TemplateName } from "../utils/TemplateName.ts";
import EmailService from "./EmailService.ts";
import { EmailNotificationData } from "./NotificationData.ts";


export default class NotificationSender{

    static emailService:INotificationService = new EmailService();
    
    static send_welcome_email=async(emailNotificationData: EmailNotificationData)=>{
        welcome_mail_object.notificationType = NotificationType.EMAIL;
        welcome_mail_object.templateName = TemplateName.WELCOME_EMAIL;
        welcome_mail_object.recipient.email = emailNotificationData.email;
        welcome_mail_object.phone = emailNotificationData.phone || "+9162XXXXX11";
        welcome_mail_object.payload.payloadType = PayloadType.WELCOME;
        welcome_mail_object.payload.welcomeLink = emailNotificationData.welcomeLink;

        const responseData:ResponseData = await this.emailService.sendNotification(welcome_mail_object);
        console.log(`${responseData.status} , ${responseData.message}`);
    }
}
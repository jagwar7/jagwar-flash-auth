import QUEUE_CONFIG from "../config/queue_config.js";
import {  rabbitChannel } from "../Connections/RabbitConnection.js";
import INotificationService from "../Interface/INotificationService.ts";
import { ResponseData } from "../utils/ResponseData.ts";


export default class EmailService implements INotificationService{
    
    async sendNotification(payload:any): Promise<ResponseData> {
        // rabbit_mail#1
        if(!rabbitChannel){
            console.log(`📝 #1: Rabbit MQ connection is not established, Contact Admin. Error_code: rabbit_mail#1`);
            return new ResponseData(false, null, "Rabbit MQ connection is not established, Contact Admin. Error_code: rabbit_mail#1", 501);
        }

        // rabbit_mail#2
        try {
            const {name, options} = QUEUE_CONFIG.EMAIL_CONFIG;
            await rabbitChannel.assertQueue(name, options);
            const bufferData = Buffer.from(JSON.stringify(payload));
            const sendingStatus = await rabbitChannel.sendToQueue(name, bufferData, {persistent: true});
            
            if(!sendingStatus){
                console.log(`📝 #2: Failed to send email. Error_code: rabbit_mail#2`);
                return new ResponseData(false, null, "Failed to send email. Error_code: rabbit_mail#2", 501);
            }
            
            return new ResponseData(true, null, "Successfully sent mail. Plese check your mail box.", 200);
        } catch (error) {
            //  rabbit_mail#3
            console.log(`📝 There is an error while sending mail: rabbit_mail#3 ${error}`);
            return new ResponseData(false, null, `There is an error while sending mail: ${error}`, 501)
        }
    }
}
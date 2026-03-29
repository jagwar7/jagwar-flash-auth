const rabbitProtocol = require('amqplib');
const queueConfig = require('../config/queue_config');


let rabbitConnection = null;
let rabbitChannel = null;

const ConnectToRabbit =async()=>{
    if(rabbitConnection && rabbitChannel) return {rabbitConnection, rabbitChannel};

    try {
        const protocol  = 'amqp';
        const hostIP    = process.env.RABBIT_HOST;
        const user      = process.env.RABBIT_USER;
        const password  = process.env.RABBIT_PASSWORD;

        console.log(`RABBIT CONFIGS : ${hostIP} , ${user} , ${password}`);

        rabbitConnection = await rabbitProtocol.connect(`${protocol}://${user}:${password}@${hostIP}:5672`);
        rabbitChannel = await rabbitConnection.createChannel();
        
        return {rabbitConnection, rabbitChannel};
    } catch (error) {
        console.log(`❌⛔ Connection to rabbit failed : ${error.message}`);
        throw error;
    }
}


const PushNotificationToQueue=async(data)=>{
    if(!channel){
        console.log(`❌⛔ Rabbit MQ Connection is not initialized`);
        throw error;
    }

    try {
        const {name, options} = queueConfig.EMAIL_CONFIG;
        await channel.assertQueue(name, options);   // VERIFY QUEUE SETUP

        const bufferData = Buffer.from(JSON.stringify(data));

        return channel.sendToQueue(name, bufferData, {persistent: true});
    } catch (error) {
        console.log("❌⛔ Failed to push notification to Rabbit MQ");
        return false;
    }
}

module.exports = {ConnectToRabbit, PushNotificationToQueue};
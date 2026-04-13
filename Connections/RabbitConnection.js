import rabbitProtocol from 'amqplib';
import queueConfig from '../config/queue_config.js'; 

let rabbitConnection = null;
let rabbitChannel = null;

export const ConnectToRabbit = async () => {
    if (rabbitConnection && rabbitChannel) return { rabbitConnection, rabbitChannel };

    try {
        const protocol = 'amqp';
        const hostIP = process.env.RABBIT_HOST;
        const user = process.env.RABBIT_USER;
        const password = process.env.RABBIT_PASSWORD;

        console.log(`RABBIT CONFIGS : ${hostIP} , ${user} , ${password}`);

        
        rabbitConnection = await rabbitProtocol.connect(`${protocol}://${user}:${password}@${hostIP}:5672`);
        rabbitChannel = await rabbitConnection.createChannel();

        console.log(`🌐 RABBIT CHANNEL INITIALIZED`);
        console.log(`🌐 RABBIT CONNECTION ESTABLISHED`);
        
        return { rabbitConnection, rabbitChannel };
    } catch (error) {
        console.log(`❌⛔ Connection to rabbit failed : ${error.message}`);
        throw error;
    }
};

export const PushNotificationToQueue = async (data) => {
    if (!rabbitChannel) {
        console.log(`❌⛔ Rabbit MQ Connection is not initialized`);
        throw new Error("Rabbit MQ Connection is not initialized");
    }

    try {
        console.log(`☑️🎟️ Notification Send request received for data :`, data);
        const { name, options } = queueConfig.EMAIL_CONFIG;
        
        await rabbitChannel.assertQueue(name, options); 

        const bufferData = Buffer.from(JSON.stringify(data));

        return rabbitChannel.sendToQueue(name, bufferData, { persistent: true });
    } catch (error) {
        console.log("❌⛔ Failed to push notification to Rabbit MQ", error.message);
        return false;
    }
};

export {rabbitChannel};
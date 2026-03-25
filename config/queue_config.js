
const QUEUE_CONFIG = {
    EMAIL_CONFIG: {
        name: "email-queue",
        options: {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': "dead_letter_exchange",
                'x-dead-letter-routing-key': "notification.email.dlq"
            }
        }
    },
    SMS_CONFIG: {
        name: "sms-queue",
        options: { durable: true } 
    }
};

module.exports = QUEUE_CONFIG

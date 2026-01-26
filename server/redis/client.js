const redis = require('redis');

// INSTANTIATE REDIS
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('connect', ()=>{
    console.log("✅ Connected to redis");
});

redisClient.on('error', (err)=>{
    console.log('❌ Redis error: ', err);
});



// CONNECTION ATTEMPT TO REDIS 
(async()=>{
    try {
        await redisClient.connect();
        console.log('🎯 Redis client connected and ready');
    } catch (error) {
        console.log('⚠️ Failed to connect to Redis:', error.message);
    }
})();  

module.exports = redisClient;
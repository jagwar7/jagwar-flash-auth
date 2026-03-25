const redis = require('redis');

// INSTANTIATE REDIS
const REDIS_URL = process.env.REDIS_URL;
const redisClient = redis.createClient({
    url: REDIS_URL
});


redisClient.on('error', (err)=>{
    console.log('❌ Redis error: ', err);
});



// CONNECTION ATTEMPT TO REDIS 
const RedisConnectionSetup = async(startTime)=>{
    try {
        await redisClient.connect();
        console.log(`🌐✅ #1. Redis is connected successfully in ${Date.now()-startTime} ms`);
    } catch (error) {
        console.log(`❌⚠️ #1. Failed to connect Redis, Error: ${error.message}`);
        process.exit(1);    
    }
}


module.exports = {redisClient, RedisConnectionSetup};
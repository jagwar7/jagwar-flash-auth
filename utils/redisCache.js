import { UserCredentials } from '../models/UserCredentials.model';
import {redisClient, RedisConnectionSetup} from '../Connections/RedisConnection.js';


// CONST CAHCHE DURATION
const CACHE_DURATION = 1800

const getSiteData = async(clientPublicKey, db) =>{
    const cacheKey = `site_data:${clientPublicKey}`;
    console.log(`cache key: ${cacheKey}`);

    try {
        // CHECK IF REDIS IS CONNECTED
        if (!redisClient || !redisClient.isReady) {
            console.log('⚠️ Redis not ready, falling back to MongoDB');
            throw new Error('Redis not ready');
        }

        // ATTEMPT FOR GETTING DATA FROM REDIS BY KEY
        const cachedData = await Promise.race([
            redisClient.get(cacheKey),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis timeout')), 1000)
            )
        ]);
        
        // IF DATA IN EXIST IN REDIS , THEN RETURN FROM MEMORY
        if(cachedData){
            console.log(`cache data: `,cachedData);
            console.log('📦 Returning cached data from Redis');
            return JSON.parse(cachedData);
        }
        

        // FETCH DATA FROM MONGODB
        console.log("🌐🔂 Fetching site data from MongoDB...");
        const userCredentialCollection = db.model('UserCredentials', UserCredentials);
        const siteData = await userCredentialCollection.findOne({clientPublicKey: clientPublicKey});
        
        // IF SITE DATA EXIST , THEN STORE IN REDIS BY KEY
        if(siteData){
            try {
                // CACHE TIMEOUT
                await Promise.race([
                    redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(siteData)),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cache timeout')), 1000)
                    )
                ]);
                console.log('✅ Data cached in Redis');
            } catch (cacheError) {
                console.log('❌⚠️ Could not cache in Redis:', cacheError.message);
            }
        }

        return siteData;
    } catch (error) {
        console.log('❌ Redis error, falling back to MongoDB:', error.message);
        // FALLBACK TO MONGODB
        const userCredentialCollection = db.model('UserCredentials', UserCredentials);
        return await userCredentialCollection.findOne({ clientPublicKey: clientPublicKey });
    }
}




const invalidateSiteData =async(clientPublicKey)=>{
    const cachedKey = `site_data:${clientPublicKey}`;
    await redisClient.del(cachedKey);
    console.log('Old site data removed from redis');
};

export {getSiteData, invalidateSiteData};
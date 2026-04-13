const mongoose = require('mongoose');

mongoDBUrl = process.env.MONGODB_CONNECTION_URL;
const FlashAuthDBConnection =async(startTime)=>{
    const FlashAuthDB = mongoose.createConnection(mongoDBUrl, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 5000, // CONNECTION TIMEOUT
        autoIndex: false, 
    });


    FlashAuthDB.on('connecting', () => console.log("🔄 Connecting to FlashAuth database..."));
    FlashAuthDB.on('connected', () => console.log(`🌐✅ #3. Connected to FlashAuth database in ${Date.now() - startTime} ms`));
    FlashAuthDB.on('error', (error) => console.error("❌ Connection failed to FlashAuth DB:", error.message, new Date().toISOString()));
    FlashAuthDB.on('disconnected', () => console.warn("⚠️ Disconnected from FlashAuth DB at", new Date().toISOString()));
    FlashAuthDB.on('reconnected', () => console.log("🔄 Reconnected to FlashAuth DB at", new Date().toISOString()));

    FlashAuthDB.asPromise().catch((err) => console.error("❌ FlashAuthDB init error:", err.message, new Date().toISOString()));



    return FlashAuthDB;
}


module.exports = FlashAuthDBConnection;
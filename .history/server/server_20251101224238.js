const express = require('express');
const mongoose = require('mongoose');
const AuthRouter = require('./routes/AuthRouter');
const FlashAuthRouter = require('./routes/FlashAuthRouter');
const CredentialsRouter = require('./routes/CredentialsRouter');

require('dotenv').config();
const cors = require('cors'); 
const server = express();

// Debug mode
const debug = true;

server.use((req, res, next) => {
    if (debug) console.log(`🌐 Incoming request: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
    next();
});





// REQUIRED COMPONENTS----------------------------------------------------------------------------------------------------
server.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
server.use(express.json());





// MONGOOSE CONNECTION SETUP----------------------------------------------------------------------------------------------
const startTime = Date.now();
const FlashAuthDB = mongoose.createConnection(process.env.MONGODB_CONNECTION_URL, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 5000, // CONNECTION TIMEOUT
    autoIndex: false, 
});





FlashAuthDB.on('connecting', () => console.log("🔄 Connecting to FlashAuth database..."));
FlashAuthDB.on('connected', () => console.log(`✅ Connected to FlashAuth database in ${Date.now() - startTime}ms`));
FlashAuthDB.on('error', (error) => console.error("❌ Connection failed to FlashAuth DB:", error.message, new Date().toISOString()));
FlashAuthDB.on('disconnected', () => console.warn("⚠️ Disconnected from FlashAuth DB at", new Date().toISOString()));
FlashAuthDB.on('reconnected', () => console.log("🔄 Reconnected to FlashAuth DB at", new Date().toISOString()));

FlashAuthDB.asPromise().catch((err) => console.error("❌ FlashAuthDB init error:", err.message, new Date().toISOString()));




// DATABASE CONNENTION HANDLER---------------------------------------------------------------------------------------------------------------------------------------
const ensureConnection = async (req, res, next) => {
    if (debug) console.log(`🔍 Checking FlashAuthDB readiness, READY_STATE: ${FlashAuthDB.readyState}, \nTIME_STAMPS: ${new Date().toISOString()}, \nrequest: ${req.originalUrl}`);
    if (FlashAuthDB.readyState !== 1) {
        console.error(`🚫 DB not ready, READY_STATE: ${FlashAuthDB.readyState} \nTIME_STAMPS: ${new Date().toISOString()}`);
        return res.status(503).json({ err: "Database is not ready, please try again later" });
    }
    if (debug) console.log(`✅ DB ready, passing to router at ${new Date().toISOString()}`);
    req.db = FlashAuthDB;
    next();
};
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------







// ROUTES-----------------------------------------------------------------------------------------------------------------
server.use('/api/auth', ensureConnection, AuthRouter);
server.use('/api/flashauth', ensureConnection, FlashAuthRouter);
server.use('/api/credentials', ensureConnection, CredentialsRouter);
//------------------------------------------------------------------------------------------------------------------------






// RUN EXPRESS SERVER-----------------------------------------------------------------------------------------------------

const port = process.env.PORT || 5900
server.listen(port, () => {
    console.log(`Server running on port: ${'po'} at ${new Date().toISOString()}`);
});


process.on('unhandledRejection', (err) => {
    console.error('❌ SERVER ERROR:', err.message, err.stack, new Date().toISOString());
});
//------------------------------------------------------------------------------------------------------------------------

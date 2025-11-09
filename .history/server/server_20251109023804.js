const express = require('express');
const mongoose = require('mongoose');
const AuthRouter = require('./routes/AuthRouter');
const FlashAuthRouter = require('./routes/FlashAuthRouter');
const CredentialsRouter = require('./routes/CredentialsRouter');

require('dotenv').config();
const cors = require('cors'); 
const server = express();

// Debug mode
const debug = false;

server.use((req, res, next) => {
    if (debug) console.log(`🌐 Incoming request: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
    next();
});





// REQUIRED COMPONENTS----------------------------------------------------------------------------------------------------
server.use(express.json());


server.use(cors({
  origin: 'http://localhost:3',
  credentials: true
}));






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
  try {
    if (FlashAuthDB.readyState !== 1) {
      return res.status(503).json({ err: "Database is not ready" });
    }
    req.db = FlashAuthDB;
    next();
  } catch (err) {
    next(err); // Let Express error handler catch it
  }
};
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------





// ROUTES-----------------------------------------------------------------------------------------------------------------
server.use('/api/auth', ensureConnection, AuthRouter);
server.use('/api/flashauth', ensureConnection, FlashAuthRouter);
server.use('/flashauth/credentials', ensureConnection, CredentialsRouter);
//------------------------------------------------------------------------------------------------------------------------






// RUN EXPRESS SERVER-----------------------------------------------------------------------------------------------------


const port =  5900
server.listen(port, () => {
    console.log(`Server running on port: ${port} at ${new Date().toISOString()}`);
});


process.on('unhandledRejection', (err) => {
    console.error('❌ SERVER ERROR:', err.message, err.stack, new Date().toISOString());
});
//------------------------------------------------------------------------------------------------------------------------

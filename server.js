const express = require('express');
const mongoose = require('mongoose');
const AuthRouter = require('./routes/AuthRouter');
const FlashAuthRouter = require('./routes/FlashAuthRouter');
const CredentialsRouter = require('./routes/CredentialsRouter');
const {RedisConnectionSetup, connectToRedis} = require('./Connections/RedisConnection')
require('dotenv').config();
const cors = require('cors'); 
const FlashAuthDBConnection  = require('./Connections/MongoDBConnection');
const { ConnectToRabbit } = require('./Connections/RabbitConnection');
const server = express();

// Debug mode
const debug = true;
server.use((req, res, next) => {
    if (debug) console.log(`🌐 Incoming request: ${req.method} ${req.originalUrl} at ${new Date().toLocaleTimeString()}`);
    next();
});





// REQUIRED COMPONENTS----------------------------------------------------------------------------------------------------
server.use(express.json());

server.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    credentials: true,
  })
);





// MONGOOSE CONNECTION SETUP----------------------------------------------------------------------------------------------
const startTime = Date.now();
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



// DATABASE CONNENTION HANDLER---------------------------------------------------------------------------------------------------------------------------------------
const ensureConnection = async (req, res, next) => {
  try {
    if (FlashAuthDB.readyState !== 1) {
      return res.status(503).json({ err: "Database is not ready" });
    }
    req.db = FlashAuthDB;
    next();
  } catch (err) {
    next(err);
  }
};
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------






// REDIS CONNECTION--------------------------------------------------------------------------------------------------------------------------------------------------

const port = process.env.CONTAINER_PORT;
const startServer = async () => {
    // START REDIS FIRST
    RedisConnectionSetup(startTime).then(()=>{
        ConnectToRabbit().then(()=>{
            const runningServer = server.listen(port, ()=>{
              console.log(`🌐✅ #3. Server started inside docker port : ${port} in ${Date.now()-startTime} ms`);
            });
            
            runningServer.on('error', (err)=>{
              console.log(`❌⚠️ #3. Critical server failure: ${err.message}`);
            });
        }).catch((err)=>{
            console.log(`❌⛔ #2 Failed to setup Rabbit MQ Connection : ${err.message}`);
        });
    }).catch((err)=>{
        console.log(`❌⚠️#1. Critical failure on redis`);
    })

};
startServer();
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------






// ROUTES-----------------------------------------------------------------------------------------------------------------
server.get('/', (req, res)=>{
  res.status(200).send("welcome to flashauth")
})
server.use('/api/auth', ensureConnection, AuthRouter);
server.use('/api/flashauth', ensureConnection, FlashAuthRouter);
server.use('/flashauth/credentials', ensureConnection, CredentialsRouter);
//------------------------------------------------------------------------------------------------------------------------







process.on('unhandledRejection', (err) => {
    console.error('❌ SERVER ERROR:', err.message, err.stack, new Date().toISOString());
});
//------------------------------------------------------------------------------------------------------------------------

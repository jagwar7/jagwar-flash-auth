const express = require('express');
const mongoose = require('mongoose');
const AuthRouter = require('./routes/AuthRouter');
const FlashAuthRouter = require('./routes/FlashAuthRouter');
const CredentialsRouter = require('./routes/CredentialsRouter');

require('dotenv').config();
const cors = require('cors'); 

const server = express();


// REQUIRED COMPONENTS----------------------------------------------------------------------------------------------------
server.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
server.use(express.json());



//------------------------------------------------------------------------------------------------------------------------




// MONGOOSE CONNECTION SETUP----------------------------------------------------------------------------------------------
mongoose.connect(process.env.MONGODB_CONNECTION_URL).then(()=>{
    console.log("connected to mongodb data database");
}).catch(()=>{
    console.log("failed to connect to mongodb database");
});
//------------------------------------------------------------------------------------------------------------------------





// AUTHENTICATION ROUTES -------------------------------------------------------------------------------------------------
server.use('/api/auth', AuthRouter);
server.use('/api/flashauth', FlashAuthRouter);
server.use('/api/credentials', CredentialsRouter);
//------------------------------------------------------------------------------------------------------------------------






// RUN EXPRESS SERVER-----------------------------------------------------------------------------------------------------
server.listen(process.env.SERVER_PORT, ()=>{
    console.log(`Server running on port: ${process.env.SERVER_PORT}`);
});
//------------------------------------------------------------------------------------------------------------------------



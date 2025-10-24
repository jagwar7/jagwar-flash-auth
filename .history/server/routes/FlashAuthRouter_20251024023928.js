const express = require('express'); 
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {RedirectURL}  = require('../utils/constants.js');
const { findOrCreate, TryLocalSignin, FetchProfile} = require('../services/clientUserServices.js');
const { UserCredentials } = require('../models/UserCredentials.model.js');


const router = express.Router();



// GET: SEND GOOGLE AUTH URL ---> FLASHAUTH-SDK
router.get('/google/url', async(req, res)=>{
    const clientPublicKey = req.header('X-Client-Id');
    console.log(clientPublicKey);
    try {
        const clientPublicKey = req.header('X-Client-Id');
        if(!clientPublicKey){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
        }

        // FIND USER CREDENTIALS 
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        const siteData = await userCredentialCollection.findOne({clientPublicKey: clientPublicKey});

        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }

        const {googleClientId, googleClientSecret} = siteData;

        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            RedirectURL
        );
        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account",
            state: clientPublicKey
        });

        if(!authURL){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin"});
        }

        const data = {
            success: true,
            url: authURL
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Error while generating google auth URL, Contact Admin"});
    }
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------














//  GOOGLE AUTH RESPONSE AFTER USER ATTTEMPTS TO LOGIN VIA GOOGLE-------------------------------------------------------------------------------------------
router.get('/google/callback', async(req, res)=>{
    try {
        const {code, state} = req.query;                                     // NO AUTH CODE OR CLIENT PUBLIC KEY --> CANCEL
        if(!code || !state){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin"});
        }
        
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        const siteData = await userCredentialCollection.findOne({clientPublicKey: state});     // GET SITE OWNER's INFORMATION

        if(!siteData){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }
        
        const {googleClientId, googleClientSecret, clientMongoDbUri} = siteData;
        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            RedirectURL
        );

        const tokenResponse = await oAuthClientInstance.getToken(code);     // EXCHANGE  <===> AUTH TOKEN BY PROVIDING AUTH CODE
        oAuthClientInstance.setCredentials(tokenResponse.tokens.id_token);

        const ticket = await oAuthClientInstance.verifyIdToken({            // RETURN GOOGLE USER INFORMATION AFTER VERIFYING TOKEN
            idToken: tokenResponse.tokens.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();

        const userProfile = {                                              
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            authProvider: 'google',
        };

        

        /* CREATE USER IN CLIENT'S DATA BASE------------------------------------------------
            TRY TO CREATE OR UPDATE USER IN CLIENT's DATABASE 
            ---> RETURN TYPE TRUE FOR SUCCESSFUL USER CREATION
            ---> RETURN FALSE IF ANY ERROR AND THROW ERROR TO 
                USER
        */


        // ----------------------------------------------------------------------------------
        const createOrUpdateInDb = await findOrCreate(clientMongoDbUri,userProfile);
        if(createOrUpdateInDb == false){
            return res.status(400).json({success: false, msg: createOrUpdateInDb.message});
        }
        //-----------------------------------------------------------------------------------

        const flashToken = jwt.sign(userProfile, process.env.JWT_SECRET_KEY, {
            expiresIn: siteData.tokenExpiryDuration,
        });


//------------------------------------------------------
           // ✅ SUCCESS RESPONSE
return res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash Auth</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e, #2a2a40);
      overflow: hidden;
      font-family: "Poppins", Arial, sans-serif;
    }

    .container {
      position: relative;
      animation: fadeIn 1s ease-out;
    }

    .phone {
      width: 320px;
      height: 640px;
      background: #111;
      border-radius: 35px;
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      position: relative;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .screen {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e, #3b2f63);
      position: relative;
      animation: bgMove 5s infinite alternate;
    }

    @keyframes bgMove {
      0% { background-position: left top; }
      100% { background-position: right bottom; }
    }

    .status-bar {
      display: flex;
      justify-content: space-between;
      padding: 10px 15px;
      color: #b0b0ff;
      font-size: 13px;
    }

    .content {
      text-align: center;
      padding-top: 50px;
      color: #fff;
      position: relative;
    }

    h1 {
      font-size: 42px;
      font-weight: 700;
      margin: 0;
      line-height: 1;
      background: linear-gradient(90deg, #00d4ff, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 1px;
      animation: glowText 2s infinite alternate;
    }

    @keyframes glowText {
      0% { text-shadow: 0 0 5px #00d4ff; }
      100% { text-shadow: 0 0 20px #a855f7; }
    }

    .checkmark-circle {
      margin: 40px auto;
      width: 110px;
      height: 110px;
      background: radial-gradient(circle, #00d4ff, #6a00ff);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 0 25px #00d4ff, 0 0 60px #6a00ff;
      animation: pulse 2s infinite ease-in-out;
    }

    .checkmark-circle .fas {
      font-size: 55px;
      color: #fff;
    }

    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 20px #00d4ff; }
      50% { transform: scale(1.05); box-shadow: 0 0 40px #6a00ff; }
      100% { transform: scale(1); box-shadow: 0 0 20px #00d4ff; }
    }

    .lightning {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 3px;
      height: 220px;
      background: linear-gradient(to bottom, #ff00ff, #00d4ff);
      transform: translate(-50%, -50%);
      filter: blur(6px);
      opacity: 0.8;
      animation: flicker 0.3s infinite alternate;
    }

    .lightning::before,
    .lightning::after {
      content: '';
      position: absolute;
      width: 2px;
      height: 100px;
      background: linear-gradient(to bottom, #ff00ff, #00d4ff);
      filter: blur(6px);
    }

    .lightning::before { left: -25px; transform: rotate(20deg); }
    .lightning::after { right: -25px; transform: rotate(-20deg); }

    @keyframes flicker {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    p {
      font-size: 18px;
      color: #b0b0ff;
      margin: 25px 0 15px 0;
    }

    .action-btn {
      background: linear-gradient(90deg, #3a3a60, #4b4b90);
      border: none;
      padding: 12px 25px;
      color: #00d4ff;
      font-size: 16px;
      border-radius: 25px;
      cursor: pointer;
      letter-spacing: 1px;
      transition: 0.3s;
    }

    .action-btn:hover {
      background: linear-gradient(90deg, #4b4b90, #5c5ca0);
      box-shadow: 0 0 15px #00d4ff;
    }

    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      position: absolute;
      bottom: 0;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      color: #b0b0ff;
      font-size: 13px;
    }

    .bottom-bar i { color: #b0b0ff; }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Optional close animation hint */
    .close-hint {
      position: absolute;
      bottom: 80px;
      width: 100%;
      text-align: center;
      font-size: 13px;
      color: #aaaaff;
      animation: fadeBlink 1.5s infinite;
    }

    @keyframes fadeBlink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="phone">
      <div class="screen">
        <div class="status-bar">
          <span>6:00</span>
          <span><i class="fas fa-signal"></i> <i class="fas fa-battery-full"></i></span>
        </div>
        <div class="content">
          <h1>Flash<br>Auth</h1>
          <div class="checkmark-circle">
            <i class="fas fa-check"></i>
          </div>
          <div class="lightning"></div>
          <p>Authentication Successful!</p>
          <button class="action-btn" id="close-btn">Close</button>
        </div>
        <div class="close-hint">Closing automatically in 3s...</div>
        <div class="bottom-bar">
          <i class="fas fa-home"></i>
          <span>Flash Auth v2.0</span>
          <i class="fas fa-cog"></i>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Send token message to opener
    window.opener?.postMessage({ type: "FLASHAUTH_TOKEN", token: ${flashToken} }, "*");

    // Auto-close after 3 seconds
    setTimeout(() => window.close(), 3000);

    // Manual close
    document.getElementById("close-btn").addEventListener("click", () => window.close());
  </script>
</body>
</html>

`);
//----------------------------------------------------------------



    } catch (error) {
        // console.error("Google Callback Error:", error);
        return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${siteData.clientFrontEndURL}"
                            );
                            window.close();
                        </script>

`);

    }
});
//----------------------------------------------------------------------------------------------------------------------------------------------









// SIGN UP WITH JWT-----------------------------------------------------------------------------------------------------------------------------
router.post('/local/signup', async(req, res)=>{
    const clientId = req.header('X-Client-Id'); 

    if(!clientId){
        return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({success: false, message: "CLIENT ERROR: All the fields are required"});
    }

    let siteData;
    try {
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);    // FIND CLIENT's USER COLLECTION
        siteData = await userCredentialCollection.findOne({clientPublicKey: clientId});

        if(!siteData){
            return res.status(400).json({message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const userProfile = {
            name, 
            email,
            passwordHash: hashedPassword,
            authProvider: "local"
        }

        const createOrUpdateInDb = await findOrCreate(siteData.clientMongoDbUri, userProfile);  // TRY CREATE NEW USER  

        // USER WILL BE CREATED OR CHECKED IF ALREADY EXISTS
        if(createOrUpdateInDb.success === false){
            return res.status(400).json({success: false, message: createOrUpdateInDb.message});
        }

        const userObj = {
            name, email, authProvider: "local"
        }



        const flashToken = jwt.sign(userObj, process.env.JWT_SECRET_KEY, {expiresIn: siteData.tokenExpiryDuration});
        return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${siteData.clientFrontEndURL}"
                            );
                            window.close();
                        </script>
                        `);
    } catch (error) {
        return res.send(`
                <script>
                    window.opener.postMessage(
                    { type: "FLASHAUTH_ERROR", error: "Authentication failed" },
                    "${siteData.clientFrontEndURL}"
                    );
                    window.close();
                </script>
        `);
    }
});


// SIGN IN WITH JWT ------------------------------------------------------------------------------------------------------------------------------
/**
 * MAIN LOGIC:
 *  FIND () SITE OWNER'S DB
 *  
 *  
 * 
 * 
 */



router.post('/local/signin', async(req, res)=>{
    const clientId = req.header('X-Client-Id');
    if(!clientId){
        return res.status(400).json({success: false, message: 'CLIENT ERROR: Missing client public key, Contact Admin'});
    }

    const {email, password, authType} = req.body;
    if(!email || !password || !authType){
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Missing email or password or Auth Provider"});
    }

    let siteData;
    try {
        const siteOwnerCredentials = req.db.model('UserCredentials', UserCredentials);
        siteData = await siteOwnerCredentials.findOne({clientPublicKey: clientId});
        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
        }
        const userProfileInfo = {
            email,
            password,
            authProvider : "local"
        }
        const signInResponse = await TryLocalSignin(siteData.clientMongoDbUri, userProfileInfo);

        if(signInResponse.success === false){
            return res.status(400).json({success: false, message: signInResponse.message});
        }

        const userObj = {
            name : signInResponse.data.name,
            email: signInResponse.data.email,
            authProvider: "local"
        }
        const flashToken = jwt.sign(userObj, process.env.JWT_SECRET_KEY, {expiresIn: siteData.tokenExpiryDuration});
        return res.status(200).json({success: true, message: signInResponse.message, data: flashToken});

    } catch (error) {
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
    }
});
//---------------------------------------------------------------------------------------------------------------------------------------------

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoUHJvdmlkZXIiOiJsb2NhbCIsImlhdCI6MTc2MDY4OTY4MCwiZXhwIjoxNzYwNjkzMjgwfQ.zZfwE0R_KNEiCOv40T6-eAGfmFTX0aC3YqKUA_MiTZ4










// FETCH USER PROFILE--------------------------------------------------------------------------------------------------------------------------
/**
 * LOGIC: REQUIRED FILDS: CLIENT ID AS WELLL AS AUTH TOKEN
 */

router.get('/fetch/profile', async(req, res)=>{
    const clientId = req.header('X-Client-Id');
    if(!clientId){
        return res.status(400).json({success: false, msg: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const token = req.header('Authorization')?.replace("Bearer:", "");

    if(!token){
        return res.status(400).json({success: false, msg: "CLIENT ERRROR: Missing Auth Token, Please sign in"});
    }

    let siteData;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(decodedToken);
        if(!decodedToken){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Invalid Token, Please sign in"});
        }

        const userCredentialCollections = req.db.model('UserCredentials', UserCredentials);
        siteData = await userCredentialCollections.findOne({clientPublicKey: clientId});

        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
        }
        
        const userProfile = {
            email: decodedToken.email
        }

        const fetchProfileResponse = await FetchProfile(siteData.clientMongoDbUri, userProfile);
        if(fetchProfileResponse.success == false){
            return res.status(400).json(fetchProfileResponse);
        }

        // SUCCESSFULLY FETCHED
        return res.status(200).json(fetchProfileResponse);

    } catch (error) {
        return res.status(400).json({success: false, message: "UNKNOWN SERVER ERROR: Contact Admin"});
    }
});


module.exports = router;
//--------------------------------------------------------------------------------------------------------------
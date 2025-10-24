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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlashAuth Success</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;1,500&display=swap" rel="stylesheet">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      background: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .window{
      height: 40rem;
      width: 30rem;
      background : linear-gradient(135deg, #3B0D6F 0%, #22083b 50%, #260b4a 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      position: relative;
      border-radius: 18px;
    }

    /* ✅ Brand FIXED */
    .brand {
      position: relative;
      top: 25px; /* ✅ brand moved down */
      display: flex;
      align-items: flex-start;
      gap: 8px;
      z-index: 50;
    }

    .gradient-text {
      font-weight: 900;
      font-style: italic;
      font-family: 'Archivo', sans-serif;
      letter-spacing: 1px;
      background: linear-gradient(180deg, #ff4500 0%, #ff7a4d 100%);
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-text {
      font-size: 1.75rem;
    }

    /* ✅ AUTH + by jagwar stacked properly */
    .brand-text-group {
      display: flex;
      flex-direction: column;
      margin-top: -2px;
      line-height: 1.05rem;
      padding-top: 8px;
    }

    .auth-text {
      font-size: 1.75rem;
    }

    .by-text {
      font-size: 0.6rem;
      font-weight: 600;
      padding-left: 2px;
      margin-top: -2px;
      opacity: 0.9;
    }

    .brand-icon-svg {
      width: 42px;
      height: 42px;
      animation: glow 1.5s infinite ease-in-out;
    }

    @keyframes glow {
      0%,100% { filter: drop-shadow(0 0 6px rgba(255,69,0,0.6)); }
      50% { filter: drop-shadow(0 0 20px rgba(255,69,0,1)); }
    }

    .circle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      border: 6px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.01);
      box-shadow: 0 8px 24px rgba(2,6,23,0.6),
                  0 0 10px rgba(34,197,94,0.06);
    }

    .checkmark { width: 230px; height: 230px; }

    .circle {
      stroke: #ff4500;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 260;
      stroke-dashoffset: 260;
      animation: circle 1s forwards ease-in-out;
    }
    @keyframes circle { to { stroke-dashoffset: 0; } }

    .check {
      stroke: #ff4500;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 65;
      stroke-dashoffset: 65;
      animation: check 1s forwards ease-in-out;
      animation-delay: 0.2s;
    }
    @keyframes check { to { stroke-dashoffset: 0; } }

    .bottom-area { height: 2rem; }

  </style>
</head>

<body>
  <div class="window">
    <div class="brand">
      <span class="brand-text gradient-text">FLASH</span>

      <svg class="brand-icon-svg" viewBox="0 0 1024 1024">
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff4500" />
            <stop offset="100%" stop-color="#ff7a4d" />
          </linearGradient>
        </defs>
        <path d="M704 469.333333h-200.533333L640 106.666667H405.333333l-128 448h183.466667L362.666667 960z" fill="url(#brandGradient)" />
      </svg>

      <span class="brand-text-group">
        <span class="auth-text gradient-text">AUTH</span>
        <span class="by-text gradient-text">by JAGWAR</span>
      </span>
    </div>

    <div class="circle-btn">
      <svg class="checkmark" viewBox="0 0 100 100">
        <circle class="circle" cx="50" cy="50" r="40" fill="none"/>
        <path class="check" fill="none" d="M30 50 L45 65 L70 35"/>
      </svg>
    </div>

    <div class="bottom-area"></div>
  </div>

  <script>
    if (window.opener) {
      window.opener.postMessage(
        { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
        "${siteData.clientFrontEndURL}"
      );
    }

    setTimeout(() => { window.close(); }, 10000);
  </script>
</body>
</html>

`);

//----------------------------------------------------------------



    } catch (error) {
        // console.error("Google Callback Error:", error);
return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlashAuth Success</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;1,500&display=swap" rel="stylesheet">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      background: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .window{
      height: 40rem;
      width: 30rem;
      background : linear-gradient(135deg, #3B0D6F 0%, #22083b 50%, #260b4a 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      position: relative;
      border-radius: 18px;
    }

    /* ✅ Brand FIXED */
    .brand {
      position: relative;
      top: 25px; /* ✅ brand moved down */
      display: flex;
      align-items: flex-start;
      gap: 8px;
      z-index: 50;
    }

    .gradient-text {
      font-weight: 900;
      font-style: italic;
      font-family: 'Archivo', sans-serif;
      letter-spacing: 1px;
      background: linear-gradient(180deg, #ff4500 0%, #ff7a4d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-text {
      font-size: 1.75rem;
    }

    /* ✅ AUTH + by jagwar stacked properly */
    .brand-text-group {
      display: flex;
      flex-direction: column;
      margin-top: -2px;
      line-height: 1.05rem;
    }

    .auth-text {
      font-size: 1.75rem;
    }

    .by-text {
      font-size: 0.6rem;
      font-weight: 600;
      padding-left: 2px;
      margin-top: -2px;
      opacity: 0.9;
    }

    .brand-icon-svg {
      width: 42px;
      height: 42px;
      animation: glow 1.5s infinite ease-in-out;
    }

    @keyframes glow {
      0%,100% { filter: drop-shadow(0 0 6px rgba(255,69,0,0.6)); }
      50% { filter: drop-shadow(0 0 20px rgba(255,69,0,1)); }
    }

    .circle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      border: 6px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.01);
      box-shadow: 0 8px 24px rgba(2,6,23,0.6),
                  0 0 10px rgba(34,197,94,0.06);
    }

    .checkmark { width: 230px; height: 230px; }

    .circle {
      stroke: #ff4500;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 260;
      stroke-dashoffset: 260;
      animation: circle 1s forwards ease-in-out;
    }
    @keyframes circle { to { stroke-dashoffset: 0; } }

    .check {
      stroke: #ff4500;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 65;
      stroke-dashoffset: 65;
      animation: check 1s forwards ease-in-out;
      animation-delay: 0.2s;
    }
    @keyframes check { to { stroke-dashoffset: 0; } }

    .bottom-area { height: 2rem; }

  </style>
</head>

<body>
  <div class="window">
    <div class="brand">
      <span class="brand-text gradient-text">FLASH</span>

      <svg class="brand-icon-svg" viewBox="0 0 1024 1024">
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff4500" />
            <stop offset="100%" stop-color="#ff7a4d" />
          </linearGradient>
        </defs>
        <path d="M704 469.333333h-200.533333L640 106.666667H405.333333l-128 448h183.466667L362.666667 960z" fill="url(#brandGradient)" />
      </svg>

      <span class="brand-text-group">
        <span class="auth-text gradient-text">AUTH</span>
        <span class="by-text gradient-text">by JAGWAR</span>
      </span>
    </div>

    <div class="circle-btn">
      <svg class="checkmark" viewBox="0 0 100 100">
        <circle class="circle" cx="50" cy="50" r="40" fill="none"/>
        <path class="check" fill="none" d="M30 50 L45 65 L70 35"/>
      </svg>
    </div>

    <div class="bottom-area"></div>
  </div>

  <script>
    if (window.opener) {
      window.opener.postMessage(
        { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
        "${siteData.clientFrontEndURL}"
      );
    }

    setTimeout(() => { window.close(); }, 10000);
  </script>
</body>
</html>


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
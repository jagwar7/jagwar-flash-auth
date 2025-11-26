------------------------------------------------------- BLUEPRINT -------------------------------------------------------
OBJECTIVE: This project is a B2B solution for Authentications handling, Site owner used to deal with Authentication
setup complexity. The objective of this project is to save setup time, effort and complexities. How? This project just require
users credentials like: MongoDB connection string, Firebase Authentication Credentials. Our site or the Admin will not read or 
write. site owner's mongodb database or firebase user details. Our site will just work as a processor , handling operations by 
its own. Thats it. 

Contact: jagwarauth@gmail.com for query.
-------------------------------------------------------------------------------------------------------------------------









------------------------------------------------- AUTHENTICATION PROCESS -------------------------------------------------
ENTER AUTH ROUTER
    ---> app.use('api/auth', AuthRouter);
    required: auth provider

    FROM AUTH ROUTER:

            CREATE NEW USER:
                ---> router.post('/singup', authController.singup);
                required: EMAIL, PASSWORD, AUTH PROVIDER

                STEP 1 : 
                    IF PROVIDER == 'local'
                        ---> Proceed to JWT sign up on STEP 2
                    IF PROVIDER == 'google'
                        ---> Proceed to SIGNUP WITH GOOGLE

                STEP 2 : 
                    required: google auth token
                    IF Invalid token ---> return error 
                        ---END---
                STEP 2 :
                    Decode token by Backend Token Validator --> extract email
                
                STEP 3 : 
                    If email exist in database --> return to SIGN IN page
                        ---END---
                STEP 4:
                    CREATE new user to database and sign user info by JWT (Expiry time required)
                    return successful response
                    ---END---







            SIGN IN:
                ---> router.post('/signin', authController.signin);
                required: EMAIL and PASSWORD

                ---> RESPONSE: get token (expiry time: 1 Hour)   || token required for each and every API call




------------------------------------------------------ LOCAL PASSWORD RESET --------------------------------------------------------
LOCAL PASSWORD RESET:
    ---> server.use('api/auth/', AuthRouter);
    required: Email and App Password for email
    
    FROM AUTH ROUTER:

            REQUEST PASSWORD RESET:
                ---> router.post('/password-reset-request', PasswordManager.RequestPasswordReset)
                required: EMAIL

                STEP 1:
                    Check IF USER DOESNT EXIST ---> return error, 
                        ---END---
                STEP 2:
                    GENERATE TOKEN with EXPIRY TIME (10 mint from generation time)
                    Save Token and Expiry time to user data in MongoDB
                STEP 4:
                    Send same token + verification link to user email, using NodeMailer
                STEP 5:
                    On Clink verification link ---> user will redirected to verification link ---> call-> ResetPassword()

    FROM AUTH ROUTER:

            RESET PASSWORD:
                ---> router.post('/reset-password', PasswordManager.ResetPassword)
                required: token and New Password (enterd by user)

                STEP 1:
                    Find the user by token and compare (EXPIRY TIME >= CURRENT TIME)
                    Is False --> return Error message ---END---
                STEP 2:
                    Hash the password (entered by User) -> Update the password
                    Return success message
                STEP 3:
                    Return unexpected error, If there ---END---
                






---------------------------------------- USER SCHEMA AND RULES FOR FLASHAUTH -----------------------------------------------------
USER's REQUIRED INFORMATION:
    ---> NAME, EMAIL, PASSWORD (for local auth only)
    ---> USER ROLE, AUTH TYPE,
    ---> RESET PASSWORD TOKEN, RESET TOKEN EXPIRY(duration: Date())





------------------------------------------------ CLIENT'S USER PROPERTY ----------------------------------------------------------
USER's PROFILE INFORMATIONS:
    ---> NAME, EMAIL, PASSWORD (for local auth only)
    ---> AUTH SOURCE(type) , 
    ATTENTION: USER WILL HAVE TO FOLLOW THE DEFINED SCHEMA RULE ON FLASHAUTH DOCUMENTATION
               OTHERWISE FLASHAUTH WILL NOT WORK FOR USER CREATION

    AS ON: 23/09/25 ---> NO MODIFICATION NEEDED FOR MY CLIENT








----------------------------------------------- CLIENT'S USER CREDENTIALS ----------------------------------------------------------
CLIENT's USER CREDENTIALS:
    ---> CLIENT PUBLIC KEY:         A KEY THAT IS REQUIRED FOR FLASHAUTH TO RECOGNIZE CLIENT SITE
    ---> CLIENT SECRET KEY:         A KEY THAT WILL STORE IN FLASHAUTH BACKEND FOR CLIENT RECOGNITION
    ---> GOOGLE CLIENT ID:          FLASHAUTH CLIENT's SITE GOOGLE CLIENT ID (will be stored in flashauth database by hashing) 
    ---> GOOGLE CLIENT SECRET:      FLASHAUTH CLIENT's SITE GOOGLE CLIENT SECRET (will be stored in flashauth database by hashing)
    ---> CLIENT's MONGODB URL :     FLASHAUTH WILL USE THIS FOR CREATING USER AT CLIENT's DATABASE  
    ---> TOKEN EXPIRY TIME:         CLIENT CAN DECIDE THE DURATION FOR LOGIN HIS USER [ENUM]









---------------------------------------- UNIVERSAL USER SCHEMA FOR CLIENT's USERs --------------------------------------------------
CLIENT's USER CREDENTIALS:
    ---> NAME: REQUIRED
    ---> EMAIL: REQUIRED
    ---> FALSH_AUTH_USER_ID: AUTO GENERATED :: REQUIRED
    ---> AUTH_PROVIDER: [google, local, github] :: REQUIRED
    ---> PASSWORD(hash): FOR LOCAL AUTH(JWT) ONLY :: REQUIRED
    ---> AVATAR: DOESNT REQURIED
    ---> EMAIL VERIFIED: FALSE (default)
    ---> CREATED AT: DATE
    ---> UPDATED AT: DATE
    ---> PASSWORD RESET TOKEN
    ---> PASSWORD EXPIRY TOKEN

WORKFLOW:
    ---> GOOGLE SIGN IN :
            ::-> FlashAuth will attempt sign in:
                PASS USER DATA (name, email, password) to FlashAuth backend, 
                FlashAuth will check if user exist by EMAIL (in client's database)
                    if Yes, Then sign in and Return user data as token,
                
                Otherwise, Create a new user by schema rules and return token



TEMPORARY:

googleClientId : 46763810748-e0cis8m2t3o7jnc1r3af486887f3u7pk.apps.googleusercontent.com
googleClientSecret: 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
mongoUri: mongodb+srv://flashauthtest:Akhter2000@cluster0.4txup3q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
callback: http://localhost:5900/api/flashauth/google/callback
firebaseAPIkey: AIzaSyCgWo4Dz_n5jjjoHs4nAitXSWh5Dyhjx60
firebaseAuthDomain : flashauth-test.firebaseapp.com
firebaseAppId: 1:46763810748:web:0b7607317b14a6a71755b9

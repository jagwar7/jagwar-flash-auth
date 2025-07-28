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
                


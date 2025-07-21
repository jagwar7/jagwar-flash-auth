------------------------------------------------------- BLUEPRINT -------------------------------------------------------
OBJECTIVE: This project is for Authentiacation solution.   Every  MERN   stack site requies authentication processs,  The 
objective of This projcet is to save the Time , Effort and Setup complications for site owner. 

How will it work ?
---> User have to update his own MongoDB and Fireabase auth credentials to my site. 










------------------------------------------------- AUTHENTICATION PROCESS -------------------------------------------------
ENTER AUTH ROUTER
    ---> app.use('api/auth', AuthRouter);

    FROM AUTH ROUTER:

            CREATE NEW USER:
                ---> router.post('/singup', authController.singup);
                required: EMAIL and PASSWORD

                STEP 1 : 
                    Express Validator will verify email and password according to validation rules : 1ST ITEM OF ARRAY
                    IF invalid rules ---> Return ERROR

                STEP 2 : 
                    If email found in database, means user already exist ---> Return ERROR
                
                STEP 2 :
                    CREATE NEW USER in database ( encrypt password using BYCRYPT HASHING before store)
                
                STEP 3 : 
                    AFTER CRAETING NEW USER mongodb user: _id will be passed in token


                ---> RESPONSE: get token (expiry time: 1 Hour)   || token required for each and every API call





            SIGN IN:
                ---> router.post('/signin', authController.signin);
                required: EMAIL and PASSWORD

                ---> RESPONSE: get token (expiry time: 1 Hour)   || token required for each and every API call
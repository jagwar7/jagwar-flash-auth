import React from "react";
import { SignInWithGoogleController, SignUpWithGooleController } from "./AuthHanlder";



const FireBaseAuth = () => {


  const handleGoogleSignUp = async()=>{
    SignUpWithGooleController();
  }

  const handleGoogleSignIn = async()=>{
    SignInWithGoogleController();
  }


  return(
    <div>
      <button onClick={handleGoogleSignUp}>Sign UP with Google</button>
      <button onClick={handleGoogleSignIn}>Sign IN with Google</button>
    </div>
  )
   
};

export default FireBaseAuth;

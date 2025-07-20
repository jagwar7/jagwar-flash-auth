import React from "react";
import { SignUpWithGooleController } from "./AuthHanlder";



const FireBaseAuth = () => {


  const handleGoogleLogin = async()=>{
    SignUpWithGooleController();
  }


  return <button onClick={handleGoogleLogin}>Sign in with Google</button>;
};

export default FireBaseAuth;

import { SignInWithGoogle, SignUpWithGoogle } from "../APIs/AuthAPI";
import {auth, googleProvider} from '../Config/FirebaseConfig'
import { signInWithPopup } from "firebase/auth";

export const SignUpWithGooleController = async()=>{
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        const data = await SignUpWithGoogle(idToken);

        localStorage.setItem("authToken", data.token);
        console.log("JWT from backend:", data.msg); 
    } catch (err) {
        console.error("Google Sign-In Failed:", err);
    }
}


export const SignInWithGoogleController = async()=>{
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        const data = await SignInWithGoogle(idToken);
        localStorage.setItem("authToken: ", data.token);
        console.log("message: ", data.msg);
    } catch (error) {
        console.error("Google Sign-In failed ", error);
    }
}


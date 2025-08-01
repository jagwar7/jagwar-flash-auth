import axios from 'axios';

const serverURL = `${process.env.REACT_APP_SERVER_API}/api/auth`;


export const SignUpWithGoogle = async(googleToken)=>{
    const response = await axios.post(`${serverURL}/signup`, 
        {provider: 'google'}, 
        {
            headers: {
                "Content-Type": "application/json",
                Authorization : `Bearer google:${googleToken}`
            }
        }
    );
    return response.data;
}



export const SignInWithGoogle = async(googleToken)=>{
    const response = await axios.post(`${serverURL}/signin`, 
        {provider: 'google'}, 
        {
            headers: {
                "Content-Type": "application/json",
                Authorization : `Bearer google:${googleToken}`
            }
        }
    );
    return response.data;
}
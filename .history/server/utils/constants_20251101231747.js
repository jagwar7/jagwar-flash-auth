import  from 'dotenv'


const serverURL = process.env.REACT_APP_RENDER_URL;
console.log(serverURL);
export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
require('dotenv').config();

console.log(process.env.RENDER_URL);
const serverURL =  'http://localhost:5900';

export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
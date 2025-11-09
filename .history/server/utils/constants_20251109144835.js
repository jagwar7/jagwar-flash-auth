require('dotenv').config();

<<<<<<< HEAD
const serverURL = process.env.RENDER_URL;

const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
console.log(`🌐 Render URL log ${serverURL}`);
module.exports = { RedirectURL };
=======
const localServer =  'http://localhost:5900';
const renderServer = 'https://jagwar-flash-auth.onrender.com';
export const RedirectURL = `${renderServer}/api/flashauth/google/callback`;
>>>>>>> stable

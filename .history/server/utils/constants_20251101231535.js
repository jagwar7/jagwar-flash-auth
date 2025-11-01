const packageName = require('packageName');



const serverURL = process.env.REACT_APP_RENDER_URL;
console.log(serverURL);
export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
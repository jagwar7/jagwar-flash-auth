const dotenv = require('dotenv');
dotenv.config();

const serverURL = process.env.RENDER_URL;
console.log(serverURL);

const RedirectURL = `${serverURL}/api/flashauth/google/callback`;

module.exports = { RedirectURL };

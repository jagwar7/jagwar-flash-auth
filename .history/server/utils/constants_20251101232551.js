require('dotenv').config();

const serverURL = process.env.REACERENDER_URL;
console.log(serverURL);

const RedirectURL = `${serverURL}/api/flashauth/google/callback`;

module.exports = { RedirectURL };

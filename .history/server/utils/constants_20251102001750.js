require('dotenv').config();

const serverURL = process.env.RENDER_URL;

const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
console
module.exports = { RedirectURL };

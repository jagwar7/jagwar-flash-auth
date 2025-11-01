require('dotenv').config();

const serverURL = process.env.REACT_APP_RENDER_URL;

const RedirectURL = `${serverURL}/api/flashauth/google/callback`;

module.exports = { RedirectURL };

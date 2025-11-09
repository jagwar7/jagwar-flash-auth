require('dotenv').config();

const serverURL = process.env.RENDER_URL || ;

export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
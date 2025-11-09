require('dotenv').config();

const serverURL = process.env.RENDER_URL || 'http:;

export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
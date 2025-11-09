require('dotenv').config();

const serverURL = process.env.RENDER_URL || 'http://localhost:5900';

export const RedirectURL = `${serverURL}/api/flashauth/google/callback`;
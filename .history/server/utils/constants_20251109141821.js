const express = require('express');
import dot
dotenv.config();
console.log(process.env.RENDER_URL);

const localServer =  'http://localhost:5900';
const renderServer = 'https://jagwar-flash-auth.onrender.com';
export const RedirectURL = `${renderServer}/api/flashauth/google/callback`;
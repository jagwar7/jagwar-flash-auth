const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const localServer =  'http://localhost:5900';
const renderServer = 'https://jagwar-flash-auth.onrender.com';
export const RedirectURL = `${renderServer}/api/flashauth/google/callback`;
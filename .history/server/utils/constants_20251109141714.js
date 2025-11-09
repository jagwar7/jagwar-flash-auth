const express = require('express');
const dotenv = require('dotenv')
const localServer =  'http://localhost:5900';
const renderServer = 'https://jagwar-flash-auth.onrender.com';
export const RedirectURL = `${renderServer}/api/flashauth/google/callback`;
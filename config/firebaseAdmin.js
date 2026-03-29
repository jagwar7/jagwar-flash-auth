require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'firebase_config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

module.exports = admin;

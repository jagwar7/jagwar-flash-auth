require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// __dirname ensures it looks in the same folder as this script
const serviceAccountPath = path.join(__dirname, 'firebase_config.json');

admin.initializeApp({
  // This reads the physical file created by your Jenkins pipeline
  credential: admin.credential.cert(require(serviceAccountPath)),
});

module.exports = admin;

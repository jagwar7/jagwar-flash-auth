require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Point directly to the file created by the Jenkins pipeline
const serviceAccountPath = path.join(__context, 'firebase_config.json');

admin.initializeApp({
  // Instead of mapping 10 variables, we just load the whole file
  credential: admin.credential.cert(require(serviceAccountPath)),
});

module.exports = admin;

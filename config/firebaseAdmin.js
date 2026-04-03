import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = path.join(__dirname, 'firebase_config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

export default admin;
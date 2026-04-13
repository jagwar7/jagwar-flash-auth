import  admin from 'firebase-admin';
import  path from 'path';
import  dotenv from 'dotenv';
import {fileURLToPath} from 'url';
dotenv.config();

const serviceAccountPath = path.join(import.meta.dirname, 'firebase_config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

export default admin;
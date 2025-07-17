import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSy...",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fitappmobile.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "fitappmobile",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fitappmobile.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
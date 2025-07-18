import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inizializzazione con persistenza
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
db.settings({
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Abilita persistenza offline
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multi-tab persistence not supported");
    } else if (err.code === 'unimplemented') {
      console.warn("Browser does not support offline persistence");
    }
  });

// Configurazione emulator solo in sviluppo
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };
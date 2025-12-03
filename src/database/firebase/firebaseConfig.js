import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';

// Import dinamico e sicuro di functions
let functionsInstance = null;
try {
  // Controlla se il modulo è installato
  const functionsModule = require('@react-native-firebase/functions');
  if (functionsModule && functionsModule.default) {
    functionsInstance = functionsModule.default;
  }
} catch (error) {
  console.warn('⚠️ Firebase Functions non disponibile:', error.message);
}

// ================= CONFIG FIREBASE =================
const firebaseConfig = {}; // @react-native-firebase legge dai file nativi

// ================= INIZIALIZZAZIONE =================
let firebaseInitialized = false;
let firebaseServices = null;
let networkState = null;
let healthCheckInterval = null;

const detectEmulator = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const DeviceInfo = require('react-native-device-info');
    return await DeviceInfo.isEmulator();
  } catch {
    return Platform.isTesting || (__DEV__ && Platform.constants?.Model?.includes('sdk_gphone'));
  }
};

const getNetworkState = async () => {
  try {
    const state = await NetInfo.fetch();
    const isEmulator = await detectEmulator();
    const emulatorHost = isEmulator ? '10.0.2.2' : null;
    const useEmulators = __DEV__ && isEmulator;
    return { isConnected: state.isConnected, type: state.type, isEmulator, useEmulators, emulatorHost };
  } catch {
    return { isConnected: false, useEmulators: false, emulatorHost: null, isEmulator: false };
  }
};

const checkFirebaseHealth = async (db) => {
  try {
    const docRef = firestore().collection('_healthcheck').doc('test');
    await docRef.get();
    return { status: 'online', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'offline', error: error.message, timestamp: new Date().toISOString() };
  }
};

// ================= INIZIALIZZA TUTTE LE ISTANZE =================
export const initializeFirebase = async () => {
  if (firebaseInitialized && firebaseServices) return firebaseServices;

  networkState = await getNetworkState();

  // Configuro emulatori se necessario
  if (networkState.useEmulators && networkState.emulatorHost) {
    console.log(`[Firebase] Configurazione emulatori su: ${networkState.emulatorHost}`);
    firestore().useEmulator(networkState.emulatorHost, 8080);
    auth().useEmulator(`http://${networkState.emulatorHost}:9099`);
    database().useEmulator(networkState.emulatorHost, 9000);
  }

  // Inizializza functions solo se disponibile
  let functionsService = null;
  if (functionsInstance) {
    try {
      functionsService = functionsInstance();
      if (networkState.useEmulators && networkState.emulatorHost) {
        console.log(`[Firebase] Emulator Functions → ${networkState.emulatorHost}:5001`);
        functionsService.useEmulator(networkState.emulatorHost, 5001);
      }
    } catch (error) {
      console.warn('⚠️ Errore inizializzazione Functions:', error.message);
    }
  }

  firebaseServices = {
    auth: auth(),
    db: firestore(),
    functions: functionsService, // Può essere null
    storage: storage(),
    database: database(),
    networkState,
  };

  console.log('[Firebase Inizializzato] Servizi disponibili:',
    Object.keys(firebaseServices).filter(key => firebaseServices[key] !== null));

  firebaseInitialized = true;

  if (__DEV__) {
    healthCheckInterval = setInterval(async () => {
      const health = await checkFirebaseHealth(firebaseServices.db);
      if (health.status === 'offline') console.warn('[Firebase] Server non raggiungibile', health.error);
    }, 30000);
  }

  return firebaseServices;
};

// ================= GETTER SICURI =================
export const getFirebase = async () => {
  if (!firebaseInitialized) return await initializeFirebase();
  return firebaseServices;
};

export const cleanupFirebase = () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  firebaseInitialized = false;
  firebaseServices = null;
};

// ================= CACHE FIRESTORE =================
export const fetchWithCache = async (collectionName, queryConditions = [], cacheDuration = 3600000) => {
  const cacheKey = `cache_${collectionName}_${JSON.stringify(queryConditions)}`;
  const timestampKey = `${cacheKey}_timestamp`;

  try {
    const [cachedData, cachedTimestamp] = await Promise.all([
      AsyncStorage.getItem(cacheKey),
      AsyncStorage.getItem(timestampKey),
    ]);

    if (cachedData && cachedTimestamp && Date.now() - parseInt(cachedTimestamp, 10) < cacheDuration) {
      return JSON.parse(cachedData);
    }

    const { db } = await getFirebase();
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(timestampKey, Date.now().toString());

    return data;
  } catch (error) {
    console.error(`[Cache] Errore fetch ${collectionName}`, error);
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw error;
  }
};

export const invalidateCache = async (collectionName) => {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(k => k.startsWith(`cache_${collectionName}`));
  await Promise.all(cacheKeys.map(k => AsyncStorage.removeItem(k)));
  return cacheKeys.length;
};

// ================= EXPORT HELPERS =================
export const getAuthService = async () => (await getFirebase()).auth;
export const getDb = async () => (await getFirebase()).db;

export const getFunctionsService = async () => {
  const firebase = await getFirebase();
  if (!firebase.functions) {
    throw new Error('❌ Firebase Functions non è installato. Esegui: npm install @react-native-firebase/functions');
  }
  return firebase.functions;
};

export const getStorageService = async () => (await getFirebase()).storage;
export const getDatabaseService = async () => (await getFirebase()).database;
export const getFirebaseInfo = () => ({ isInitialized: firebaseInitialized, networkState });

// ================= APPSTATE LISTENER =================
AppState.addEventListener('change', nextAppState => {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
  } else if (nextAppState === 'active' && firebaseInitialized && !healthCheckInterval) {
    if (__DEV__) {
      healthCheckInterval = setInterval(async () => {
        await checkFirebaseHealth(firebaseServices.db);
      }, 30000);
    }
  }
});
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';

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
    return {
      isConnected: state.isConnected,
      type: state.type,
      isEmulator,
      useEmulators,
      emulatorHost
    };
  } catch {
    return {
      isConnected: false,
      useEmulators: false,
      emulatorHost: null,
      isEmulator: false
    };
  }
};

const checkFirebaseHealth = async (db) => {
  try {
    const docRef = firestore().collection('_healthcheck').doc('test');
    await docRef.get();
    return {
      status: 'online',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ================= INIZIALIZZA TUTTE LE ISTANZE =================
export const initializeFirebase = async () => {
  if (firebaseInitialized && firebaseServices) {
    return firebaseServices;
  }

  networkState = await getNetworkState();

  // Configurazione emulatori se necessario
  if (networkState.useEmulators && networkState.emulatorHost) {
    console.log(`[Firebase] Configurazione emulatori su: ${networkState.emulatorHost}`);

    try {
      firestore().useEmulator(networkState.emulatorHost, 8080);
      auth().useEmulator(`http://${networkState.emulatorHost}:9099`);
      database().useEmulator(networkState.emulatorHost, 9000);
    } catch (emulatorError) {
      console.warn('[Firebase] Errore configurazione emulatori:', emulatorError.message);
    }
  }

  // Inizializza tutti i servizi Firebase
  let functionsService = null;

  try {
    functionsService = functions();

    if (networkState.useEmulators && networkState.emulatorHost) {
      try {
        console.log(`[Firebase] Emulator Functions → ${networkState.emulatorHost}:5001`);
        functionsService.useEmulator(networkState.emulatorHost, 5001);
      } catch (functionsEmulatorError) {
        console.warn('[Firebase] Errore emulator Functions:', functionsEmulatorError.message);
      }
    }
  } catch (functionsError) {
    console.warn('[Firebase] Errore inizializzazione Functions:', functionsError.message);
    functionsService = null;
  }

  // Crea oggetto con tutti i servizi
  firebaseServices = {
    auth: auth(),
    db: firestore(),
    functions: functionsService,
    storage: storage(),
    database: database(),
    networkState,
  };

  console.log(
    '[Firebase] Inizializzazione completata. Servizi disponibili:',
    Object.keys(firebaseServices).filter(key => firebaseServices[key] !== null)
  );

  firebaseInitialized = true;

  // Health check solo in sviluppo
  if (__DEV__) {
    healthCheckInterval = setInterval(async () => {
      try {
        const health = await checkFirebaseHealth(firebaseServices.db);
        if (health.status === 'offline') {
          console.warn('[Firebase] Server non raggiungibile:', health.error);
        }
      } catch (healthError) {
        console.warn('[Firebase] Health check fallito:', healthError.message);
      }
    }, 30000); // Ogni 30 secondi
  }

  return firebaseServices;
};

// ================= GETTER SICURI =================
export const getFirebase = async () => {
  if (!firebaseInitialized) {
    return await initializeFirebase();
  }
  return firebaseServices;
};

export const cleanupFirebase = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  firebaseInitialized = false;
  firebaseServices = null;
};

// ================= CACHE FIRESTORE =================
export const fetchWithCache = async (
  collectionName,
  queryConditions = [],
  cacheDuration = 3600000
) => {
  const cacheKey = `cache_${collectionName}_${JSON.stringify(queryConditions)}`;
  const timestampKey = `${cacheKey}_timestamp`;

  try {
    const [cachedData, cachedTimestamp] = await Promise.all([
      AsyncStorage.getItem(cacheKey),
      AsyncStorage.getItem(timestampKey),
    ]);

    if (
      cachedData &&
      cachedTimestamp &&
      Date.now() - parseInt(cachedTimestamp, 10) < cacheDuration
    ) {
      return JSON.parse(cachedData);
    }

    const { db } = await getFirebase();
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    await Promise.all([
      AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
      AsyncStorage.setItem(timestampKey, Date.now().toString()),
    ]);

    return data;
  } catch (error) {
    console.error(`[Cache] Errore fetch ${collectionName}:`, error);

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        console.log(`[Cache] Using expired cache for ${collectionName}`);
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      console.error(`[Cache] Error reading cache for ${collectionName}:`, cacheError);
    }

    throw error;
  }
};

export const invalidateCache = async (collectionName) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(`cache_${collectionName}`));
    await Promise.all(cacheKeys.map(k => AsyncStorage.removeItem(k)));
    console.log(`[Cache] Invalidated ${cacheKeys.length} keys for ${collectionName}`);
    return cacheKeys.length;
  } catch (error) {
    console.error(`[Cache] Error invalidating cache for ${collectionName}:`, error);
    return 0;
  }
};

// ================= EXPORT HELPERS =================
export const getAuthService = async () => {
  const firebase = await getFirebase();
  return firebase.auth;
};

export const getDb = async () => {
  const firebase = await getFirebase();
  return firebase.db;
};

export const getFunctionsService = async () => {
  const firebase = await getFirebase();

  if (!firebase.functions) {
    console.warn('[Firebase] Functions non disponibile, ritorno mock service');

    return {
      httpsCallable: (name) => {
        return async (data) => {
          throw new Error(`Firebase Functions non disponibile. Funzione "${name}" non può essere chiamata.`);
        };
      },
      useFunctionsEmulator: (host, port) => {
        console.log(`[Mock Functions] Emulator configurato su ${host}:${port}`);
      }
    };
  }

  return firebase.functions;
};

export const getStorageService = async () => {
  const firebase = await getFirebase();
  return firebase.storage;
};

export const getDatabaseService = async () => {
  const firebase = await getFirebase();
  return firebase.database;
};

export const getFirebaseInfo = () => ({
  isInitialized: firebaseInitialized,
  networkState
});

// ================= APPSTATE LISTENER =================
const handleAppStateChange = (nextAppState) => {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    // Ferma health check in background
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  } else if (nextAppState === 'active' && firebaseInitialized && !healthCheckInterval) {
    // Riavvia health check in foreground (solo in sviluppo)
    if (__DEV__) {
      healthCheckInterval = setInterval(async () => {
        try {
          await checkFirebaseHealth(firebaseServices.db);
        } catch (error) {
          console.warn('[Firebase] Health check fallito:', error.message);
        }
      }, 30000);
    }
  }
};

// Aggiungi listener per AppState
AppState.addEventListener('change', handleAppStateChange);

// ================= EXPORT DEFAULT =================
export default {
  initializeFirebase,
  getFirebase,
  getAuthService,
  getDb,
  getFunctionsService,
  getStorageService,
  getDatabaseService,
  getFirebaseInfo,
  fetchWithCache,
  invalidateCache,
  cleanupFirebase,
};
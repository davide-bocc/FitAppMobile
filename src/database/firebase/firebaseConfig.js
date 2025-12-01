import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';

// ============= CONFIG FIREBASE =============
const firebaseConfig = {
  // NON serve, @react-native-firebase legge dai file nativi
};

// ============= INIZIALIZZAZIONE =============
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
    let emulatorHost = isEmulator ? '10.0.2.2' : null;
    let useEmulators = __DEV__ && isEmulator;
    return {
      isConnected: state.isConnected,
      type: state.type,
      isEmulator,
      useEmulators,
      emulatorHost,
    };
  } catch {
    return { isConnected: false, useEmulators: false, emulatorHost: null, isEmulator: false };
  }
};

const checkFirebaseHealth = async (db, timeout = 5000) => {
  try {
    const docRef = firestore().collection('_healthcheck').doc('test');
    await docRef.get();
    return { status: 'online', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'offline', error: error.message, timestamp: new Date().toISOString() };
  }
};

export const initializeFirebase = async () => {
  if (firebaseInitialized && firebaseServices) return firebaseServices;

  networkState = await getNetworkState();

  // Emulatori
  if (networkState.useEmulators && networkState.emulatorHost) {
    console.log(`[Firebase] Configurando emulatori su: ${networkState.emulatorHost}`);
    firestore().useEmulator(networkState.emulatorHost, 8080);
    functions().useEmulator(networkState.emulatorHost, 5001);
    auth().useEmulator(`http://${networkState.emulatorHost}:9099`);
    database().useEmulator(networkState.emulatorHost, 9000);
  }

  // Salva servizi
  firebaseServices = {
    auth: auth(),
    db: firestore(),
    functions: functions(),
    storage: storage(),
    database: database(),
    networkState,
  };
  firebaseInitialized = true;

  // Health check periodico
  if (__DEV__) {
    healthCheckInterval = setInterval(async () => {
      const health = await checkFirebaseHealth(firebaseServices.db);
      if (health.status === 'offline') console.warn('[Firebase] Server non raggiungibile', health.error);
    }, 30000);
  }

  return firebaseServices;
};

export const getFirebase = async () => {
  if (!firebaseInitialized) return await initializeFirebase();
  return firebaseServices;
};

export const cleanupFirebase = () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  firebaseInitialized = false;
  firebaseServices = null;
};

// ============= CACHE FIRESTORE =============
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
    const q = db.collection(collectionName);
    const snapshot = await q.get();
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

// ============= EXPORT HELPERS =============
export const getAuthService = () => initializeFirebase().then(s => s.auth);
export const getDb = () => initializeFirebase().then(s => s.db);
export const getFunctionsService = () => initializeFirebase().then(s => s.functions);
export const getStorageService = () => initializeFirebase().then(s => s.storage);
export const getDatabaseService = () => initializeFirebase().then(s => s.database);
export const getFirebaseInfo = () => ({
  isInitialized: firebaseInitialized,
  networkState,
});

// AppState listener
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

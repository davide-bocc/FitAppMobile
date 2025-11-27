import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { query, collection, getDocs } from 'firebase/firestore';

// Cambia a false per usare Firebase cloud reale
const USE_EMULATORS = false;

// Configurazione automatica da google-services.json
const firebaseApp = initializeApp({
  // Lasciare vuoto per usare google-services.json
});

// Inizializzazione servizi
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);
export const storage = getStorage(firebaseApp);

// Configurazione emulatori in sviluppo, solo se abilitati
if (__DEV__ && USE_EMULATORS) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Helper per fetch con cache
export const fetchWithCache = async (collectionName, queryConditions = []) => {
  const cacheKey = `cache_${collectionName}_${JSON.stringify(queryConditions)}`;
  try {
    // Prova a recuperare dalla cache
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    // Fetch da Firestore
    const q = query(collection(db, collectionName), ...queryConditions);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Salva in cache (1 ora di validità)
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

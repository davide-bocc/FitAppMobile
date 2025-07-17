import { openDatabase } from 'react-native-sqlite-storage';

// Configurazione connessione SQLite migliorata
const db = openDatabase({
  name: 'fitapp_offline.db',
  location: 'default',
  createFromLocation: '~www/fitapp.db', // Database precaricato (opzionale)
});

// Cache della connessione per performance
let databaseInstance = null;

export const getDB = async () => {
  if (!databaseInstance) {
    databaseInstance = await new Promise((resolve, reject) => {
      db.transaction(tx => resolve(tx), reject);
    });
  }
  return databaseInstance;
};

// Versione migliorata con error handling e logging
export const executeQuery = async (query, params = []) => {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      db.executeSql(
        query,
        params,
        (_, result) => {
          console.debug('Query executed:', query);
          resolve(result);
        },
        (_, error) => {
          console.error('SQL Error:', error, 'on query:', query);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw error;
  }
};

// Helper per transazioni multiple
export const executeTransaction = async (queries) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        queries.forEach(({ query, params }) => {
          tx.executeSql(query, params);
        });
      },
      reject,
      resolve
    );
  });
};
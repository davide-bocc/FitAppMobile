import { openDatabase } from 'react-native-sqlite-storage';

// Configurazione con error handling migliorato
const dbConfig = {
  name: 'fitapp_v2.db',
  location: 'default',
  createFromLocation: '~www/fitapp_preload.db', // File precaricato (opzionale)
};

const db = openDatabase(dbConfig);

// Cache della connessione con ripristino automatico
let dbInstance = null;
let isInitialized = false;

const initDB = async () => {
  if (!isInitialized) {
    await new Promise((resolve, reject) => {
      db.transaction(tx => {
        dbInstance = tx;
        isInitialized = true;
        resolve();
      }, (error) => {
        console.error('Database init error:', error);
        reject(error);
      });
    });
  }
  return dbInstance;
};

export const executeQuery = async (sql, params = []) => {
  try {
    const tx = await initDB();
    return await new Promise((resolve, reject) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('SQL Error:', { sql, params, error });
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('DB Connection Error:', error);
    throw error;
  }
};

export const executeTransaction = async (queries) => {
  const tx = await initDB();
  return new Promise((resolve, reject) => {
    tx.transaction(
      transaction => {
        queries.forEach(({ query, params }) => {
          transaction.executeSql(query, params);
        });
      },
      error => {
        console.error('Transaction Error:', error);
        reject(error);
      },
      resolve
    );
  });
};

// Utility per debugging
export const inspectDB = async () => {
  const [tables] = await executeQuery(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  console.log('Database Tables:', tables.rows.raw());
};
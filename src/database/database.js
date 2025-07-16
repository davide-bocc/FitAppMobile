import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase({
  name: 'fitapp.db',
  location: 'default'
});

export const getDB = () => db;

// Funzioni helper per SQLite
export const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};
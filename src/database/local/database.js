import SQLite from 'react-native-sqlite-2';

const db = SQLite.openDatabase({
  name: 'fitapp_v2.db',
  location: 'default',
  createFromLocation: '~www/fitapp_preload.db', // opzionale
});

export const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('SQL Error:', { sql, params, error });
          reject(error);
        }
      );
    },
    error => {
      console.error('Transaction error:', error);
      reject(error);
    });
  });
};

export const executeTransaction = (queries) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      queries.forEach(({ query, params }) => {
        tx.executeSql(query, params);
      });
    },
    error => {
      console.error('Transaction Error:', error);
      reject(error);
    },
    resolve);
  });
};

export const inspectDB = () => {
  return executeQuery("SELECT name FROM sqlite_master WHERE type='table'")
    .then(result => {
      console.log('Database Tables:', result.rows.raw());
      return result.rows.raw();
    });
};

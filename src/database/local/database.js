import SQLite from 'react-native-quick-sqlite';

const db = SQLite.open({ name: 'fitapp_v2.db', location: 'default' });

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

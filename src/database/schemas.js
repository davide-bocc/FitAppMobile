// Questo file può essere eliminato in quanto le schemas sono ora in initDB.js
// Oppure mantenuto per documentazione:

export const DB_SCHEMAS = {
  USERS: `...`, // Copia da initDB
  WORKOUTS: `...`,
  EXERCISES: `...`,
  // ecc.
};

// Se vuoi mantenere per validazione schemi:
export const validateSchema = async () => {
  const requiredTables = ['users', 'workouts', 'exercises'];
  try {
    for (const table of requiredTables) {
      const result = await executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (result.rows.length === 0) {
        throw new Error(`Missing table: ${table}`);
      }
    }
    return true;
  } catch (error) {
    console.error('Schema validation failed:', error);
    return false;
  }
};
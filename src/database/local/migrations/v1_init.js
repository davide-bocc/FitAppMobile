export default {
  version: 1,
  up: async (db) => {
    await db.executeQuery(`CREATE TABLE ...`);
  },
  down: async (db) => {
    await db.executeQuery(`DROP TABLE ...`);
  }
};
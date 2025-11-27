import { executeQuery, executeTransaction } from './database';
import { v4 as uuidv4 } from 'uuid';

const LocalDB = {
  // CRUD Base
  async create(table, data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    await executeQuery(
      `INSERT INTO ${table} (id, data, created_at, last_updated) VALUES (?, ?, ?, ?)`,
      [id, JSON.stringify(data), now, now]
    );
    return id;
  },

  async get(table, id) {
    const [result] = await executeQuery(
      `SELECT data FROM ${table} WHERE id = ?`,
      [id]
    );
    return result.rows.length > 0 ? JSON.parse(result.rows.item(0).data) : null;
  },

  async find(table, conditions = {}) {
    const where = Object.keys(conditions).map(k => `${k} = ?`).join(' AND ');
    const params = Object.values(conditions);

    const [result] = await executeQuery(
      `SELECT id, data FROM ${table} ${where ? 'WHERE ' + where : ''}`,
      params
    );

    return Array.from({ length: result.rows.length }, (_, i) => ({
      id: result.rows.item(i).id,
      ...JSON.parse(result.rows.item(i).data)
    }));
  },

  async update(table, id, updates) {
    const current = await this.get(table, id);
    if (!current) throw new Error(`Record ${id} not found in ${table}`);

    await executeQuery(
      `UPDATE ${table} SET data = ?, last_updated = ? WHERE id = ?`,
      [JSON.stringify({ ...current, ...updates }), new Date().toISOString(), id]
    );
  },

  // Sync
  async getUnsynced(table) {
    const [result] = await executeQuery(
      `SELECT id, data FROM ${table}
       WHERE last_sync IS NULL OR last_updated > last_sync`
    );
    return Array.from({ length: result.rows.length }, (_, i) => ({
      id: result.rows.item(i).id,
      ...JSON.parse(result.rows.item(i).data)
    }));
  },

  async markAsSynced(table, id) {
    await executeQuery(
      `UPDATE ${table} SET last_sync = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }
};

export default LocalDB;

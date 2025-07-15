import SQLite from 'react-native-sqlite-storage';

export class OfflineSync {
  private db = SQLite.openDatabase({ name: 'fitapp.db' });

  async pushToServer(): Promise<void> {
    // Solo dati modificati localmente
    const [changes] = await this.db.executeSql(
      `SELECT * FROM workouts WHERE dirty = 1`
    );
    // Qui mockiamo una chiamata API
    console.log('Dati da inviare:', changes.rows.raw());
  }

  async pullFromServer(): Promise<void> {
    // Mock: sostituire con chiamata reale
    const mockData = {
      workouts: [{ id: '1', name: 'Allenamento A', coach_id: '123' }]
    };

    await this.db.executeSql(
      `INSERT OR REPLACE INTO workouts (id, name, coach_id) VALUES (?, ?, ?)`,
      [mockData.workouts[0].id, mockData.workouts[0].name, mockData.workouts[0].coach_id]
    );
  }
}
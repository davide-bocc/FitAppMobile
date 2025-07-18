import { db } from '../database/firebase/firebaseConfig';
import LocalDB from '../database/local/LocalDB';
import { checkNetworkStatus } from '../utils/network';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc
} from 'firebase/firestore';

class OfflineSync {
  /**
   * Sincronizza tutti i dati non sincronizzati
   */
  async syncAll() {
    if (!await checkNetworkStatus()) {
      console.log('Nessuna connessione, salvataggio solo locale');
      return { success: false, error: 'OFFLINE' };
    }

    try {
      const results = {
        workouts: await this._syncCollection('workouts'),
        exercises: await this._syncCollection('exercises'),
        users: await this._syncCollection('users'),
        assignments: await this._syncCollection('assignments')
      };

      return {
        success: !Object.values(results).some(r => r.error),
        details: results
      };
    } catch (error) {
      console.error('Global sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincronizza una singola collezione
   */
  async _syncCollection(collectionName) {
    const unsyncedItems = await LocalDB.getUnsynced(collectionName);
    if (unsyncedItems.length === 0) {
      return { count: 0, status: 'ALREADY_SYNCED' };
    }

    const batch = writeBatch(db);
    const updates = [];

    try {
      // Preparazione batch
      unsyncedItems.forEach(item => {
        const docRef = item.firebase_id 
          ? doc(db, collectionName, item.firebase_id)
          : doc(collection(db, collectionName));

        const { id, firebase_id, last_sync, ...cleanData } = item;
        batch.set(docRef, cleanData);
        updates.push({ id, firebase_id: docRef.id });
      });

      // Esecuzione batch
      await batch.commit();

      // Aggiornamento stato locale
      await Promise.all(
        updates.map(({ id, firebase_id }) => 
          LocalDB.update(collectionName, id, { 
            firebase_id, 
            last_sync: new Date().toISOString() 
          })
      );

      return { count: updates.length, status: 'SUCCESS' };
    } catch (error) {
      console.error(`Sync failed for ${collectionName}:`, error);
      return { count: 0, error: error.message, status: 'FAILED' };
    }
  }

  /**
   * Scarica gli ultimi aggiornamenti dal server
   */
  async pullUpdates(collectionName, lastSyncDate) {
    if (!await checkNetworkStatus()) {
      throw new Error('NETWORK_REQUIRED');
    }

    try {
      const q = lastSyncDate
        ? query(
            collection(db, collectionName),
            where('updatedAt', '>', lastSyncDate)
          )
        : collection(db, collectionName);

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        last_sync: new Date().toISOString()
      }));

      if (items.length > 0) {
        await LocalDB.bulkInsert(collectionName, items);
      }

      return {
        count: items.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Pull updates failed for ${collectionName}:`, error);
      throw error;
    }
  }
}

export default new OfflineSync();
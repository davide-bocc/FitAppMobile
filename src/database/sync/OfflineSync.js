import { db } from '../firebase/firebaseConfig';
import LocalDB from '../local/LocalDB';
import { checkNetworkStatus } from '../../utils/network';
import firestore from '@react-native-firebase/firestore';

const OfflineSync = {
  async syncAll() {
    if (!await checkNetworkStatus()) {
      return { success: false, error: 'OFFLINE' };
    }

    try {
      const collections = ['users', 'workouts', 'exercises', 'assignments'];
      const results = {};

      for (const col of collections) {
        results[col] = await this._syncCollection(col);
      }

      return {
        success: !Object.values(results).some(r => r.error),
        details: results
      };
    } catch (error) {
      console.error('Global sync error:', error);
      return { success: false, error: 'SYNC_FAILED' };
    }
  },

  async _syncCollection(collectionName) {
    const unsynced = await LocalDB.getUnsynced(collectionName);
    if (unsynced.length === 0) return { count: 0 };

    const batch = writeBatch(db);
    const updates = [];

    try {
      for (const item of unsynced) {
        const docRef = item.firebase_id
          ? doc(db, collectionName, item.firebase_id)
          : doc(collection(db, collectionName));

        const { id, firebase_id, last_sync, ...cleanData } = item;
        batch.set(docRef, cleanData);
        updates.push({ id, firebase_id: docRef.id });
      }

      await batch.commit();

      // Aggiornamento locale in batch
      await executeTransaction(
        updates.map(({ id, firebase_id }) => ({
          query: `UPDATE ${collectionName} SET firebase_id = ?, last_sync = ? WHERE id = ?`,
          params: [firebase_id, new Date().toISOString(), id]
        }))
      );

      return { count: updates.length };
    } catch (error) {
      console.error(`Sync failed for ${collectionName}:`, error);
      return { count: 0, error: error.message };
    }
  }
};

export default OfflineSync;
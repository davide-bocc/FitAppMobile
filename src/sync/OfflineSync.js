
import LocalDB from '../database/local/LocalDB';
import { checkNetworkStatus } from '../utils/network';
import firestore from '@react-native-firebase/firestore';

class OfflineSync {

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

  async _syncCollection(collectionName) {
    const unsyncedItems = await LocalDB.getUnsynced(collectionName);
    if (unsyncedItems.length === 0) {
      return { count: 0, status: 'ALREADY_SYNCED' };
    }

    const batch = firestore().batch();
    const updates = [];

    try {
      unsyncedItems.forEach(item => {
        const docRef = item.firebase_id
          ? firestore().collection(collectionName).doc(item.firebase_id)
          : firestore().collection(collectionName).doc();

        const { id, firebase_id, last_sync, ...cleanData } = item;
        batch.set(docRef, cleanData);
        updates.push({ id, firebase_id: docRef.id });
      });

      await batch.commit();

      await Promise.all(
        updates.map(({ id, firebase_id }) =>
          LocalDB.update(collectionName, id, { firebase_id, last_sync: new Date().toISOString() })
        )
      );

      return { count: updates.length, status: 'SUCCESS' };
    } catch (error) {
      console.error(`Sync failed for ${collectionName}:`, error);
      return { count: 0, error: error.message, status: 'FAILED' };
    }
  }

  async pullUpdates(collectionName, lastSyncDate) {
    if (!await checkNetworkStatus()) {
      throw new Error('NETWORK_REQUIRED');
    }

    try {
      let queryRef = firestore().collection(collectionName);
      if (lastSyncDate) {
        queryRef = queryRef.where('updatedAt', '>', lastSyncDate);
      }

      const snapshot = await queryRef.get();
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        last_sync: new Date().toISOString()
      }));

      if (items.length > 0) {
        await LocalDB.bulkInsert(collectionName, items);
      }

      return { count: items.length, lastSync: new Date().toISOString() };
    } catch (error) {
      console.error(`Pull updates failed for ${collectionName}:`, error);
      throw error;
    }
  }
}

export default new OfflineSync();

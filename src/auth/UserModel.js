import { doc, getDoc } from 'firebase/firestore';
import { db, fetchWithCache } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';

export default class UserModel {
  static async getUserLocal(uid) {
    try {
      return await LocalDB.get('users', uid);
    } catch (error) {
      console.error('Local user load error:', error);
      return null;
    }
  }

  static async getUserRemote(uid) {
    try {
      // Usa il sistema di cache centralizzato
      const user = await fetchWithCache('users', [], uid);

      if (user) {
        await LocalDB.set('users', uid, {
          ...user,
          lastSync: Date.now()
        });
      }

      return user;
    } catch (error) {
      console.error('Remote user load error:', error);
      return null;
    }
  }

  static async saveUserLocal(userData) {
    try {
      await LocalDB.set('users', userData.uid, {
        ...userData,
        lastSync: Date.now()
      });
    } catch (error) {
      console.error('User save error:', error);
    }
  }
}
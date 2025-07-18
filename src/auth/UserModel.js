import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';

export default class UserModel {
  static async getUserLocal(uid) {
    return LocalDB.get('users', uid);
  }

  static async getUserRemote(uid) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      await LocalDB.set('users', uid, data); // Cache locale
      return data;
    }
    return null;
  }

  static async saveUserLocal(userData) {
    await LocalDB.set('users', userData.uid, userData);
  }
}
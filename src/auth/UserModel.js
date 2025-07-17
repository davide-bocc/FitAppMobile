import { executeQuery } from '../database/database';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class UserModel {
  // Crea utente sia su SQLite che Firebase (con fallback)
  static async createUser(userData) {
    try {
      // Prima su Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        createdAt: serverTimestamp()
      });

      // Poi su SQLite per offline
      await executeQuery(
        `INSERT INTO users
        (id, firebase_uid, email, name, role, last_sync, is_local)
        VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [
          userData.id || uuidv4(),
          userCredential.user.uid,
          userData.email,
          userData.name,
          userData.role,
          new Date().toISOString()
        ]
      );

      return userCredential.user.uid;
    } catch (firebaseError) {
      console.warn('Firebase failed, saving locally:', firebaseError);
      // Fallback a SQLite
      const localId = uuidv4();
      await executeQuery(
        `INSERT INTO users
        (id, email, name, role, is_local)
        VALUES (?, ?, ?, ?, 1)`,
        [localId, userData.email, userData.name, userData.role]
      );
      return localId;
    }
  }

  // Altri metodi con doppia implementazione...
}

export default UserModel;
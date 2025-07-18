  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { auth } from '../../database/firebase/firebaseConfig';
import UserModel from '../models/UserModel';

export const AuthService = {
  async register(email, password, userData) {
    try {
      // Solo operazione Firebase (Firestore gestisce il resto via triggers)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Salvataggio offline immediato
      await UserModel.saveUserLocal({
        uid: userCredential.user.uid,
        email,
        ...userData
      });

      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this._mapFirebaseError(error)
      };
    }
  },

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Caricamento dati da cache locale prima
      let user = await UserModel.getUserLocal(userCredential.user.uid);

      if (!user) {
        user = await UserModel.getUserRemote(userCredential.user.uid);
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: this._mapFirebaseError(error)
      };
    }
  },

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Recupera dati aggiuntivi dal tuo backend
      const backendResponse = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${await userCredential.user.getIdToken()}`
        }
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await backendResponse.json();

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this._mapFirebaseError(error)
      };
    }
  },

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this._mapFirebaseError(error) };
    }
  },

  _mapFirebaseError(error) {
    switch(error.code) {
      case 'auth/email-already-in-use':
        return 'Email già registrata';
      case 'auth/invalid-email':
        return 'Email non valida';
      case 'auth/weak-password':
        return 'Password troppo debole (min. 6 caratteri)';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email o password errati';
      case 'auth/network-request-failed':
        return 'Errore di connessione. Verifica la tua rete';
      default:
        console.error('Firebase error code:', error.code);
        return 'Errore durante l\'operazione';
    }
  },

  // Metodo per ottenere il token (utile per chiamate API)
  async getCurrentUserToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }
};
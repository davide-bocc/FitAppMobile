import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  connectAuthEmulator
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Configurazione degli endpoint
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://fitappmobile.web.app'
  : 'http://10.0.2.2:5001'; // Emulatore locale

// Connessione all'emulatore in sviluppo
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://10.0.2.2:9099');
}

export const AuthService = {
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Invia dati aggiuntivi al tuo backend
      const backendResponse = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await userCredential.user.getIdToken()}`
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          ...userData
        })
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to save user data');
      }

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData
        }
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
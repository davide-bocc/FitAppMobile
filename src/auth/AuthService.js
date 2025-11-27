import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../../database/firebase/firebaseConfig';
import UserModel from '../models/UserModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const AUTH_CACHE_KEY = 'auth_user_data';
const TOKEN_CACHE_KEY = 'auth_token_cache';
const TOKEN_TTL = 30 * 60 * 1000; // 30 minuti

export const AuthService = {
  async register(email, password, userData) {
    try {
      // 1. Operazione Firebase obbligatoria
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Salvataggio offline con timestamp
      const userToSave = {
        uid: userCredential.user.uid,
        email,
        ...userData,
        lastSync: Date.now()
      };

      await Promise.all([
        UserModel.saveUserLocal(userToSave),
        AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userToSave))
      ]);

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: this._mapFirebaseError(error) };
    }
  },

  async login(email, password) {
    try {
      // 1. Verifica credenziali con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Carica dati utente con priorità alla cache
      let user = await UserModel.getUserLocal(userCredential.user.uid);

      if (!user || Date.now() - user.lastSync > 3600000) { // 1 ora TTL
        user = await UserModel.getUserRemote(userCredential.user.uid);
      }

      // 3. Aggiorna cache auth
      await AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        lastSync: Date.now()
      }));

      return { success: true, user };
    } catch (error) {
      // Fallback offline solo se errore di rete
      if (error.code === 'auth/network-request-failed') {
        const cachedUser = await this._checkAuthCache();
        if (cachedUser && cachedUser.email === email) {
          return { success: true, user: cachedUser };
        }
      }
      return { success: false, error: this._mapFirebaseError(error) };
    }
  },

  async logout() {
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove([AUTH_CACHE_KEY, TOKEN_CACHE_KEY]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getCurrentUserToken() {
    try {
      // Controlla cache token
      const cachedToken = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
      if (cachedToken) {
        const { token, timestamp } = JSON.parse(cachedToken);
        if (Date.now() - timestamp < TOKEN_TTL) {
          return token;
        }
      }

      // Nuovo token se scaduto
      const user = auth.currentUser;
      if (!user) return null;

      const token = await user.getIdToken();
      await AsyncStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify({
        token,
        timestamp: Date.now()
      }));

      return token;
    } catch (error) {
      console.error('Token error:', error);
      return null;
    }
  },

  async _checkAuthCache() {
    const cached = await AsyncStorage.getItem(AUTH_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
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

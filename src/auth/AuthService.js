// AuthService.js - Versione per server locale
const API_BASE_URL = ''; // Android emulator (usare 10.0.2.2 invece di localhost)
// const API_BASE_URL = 'http://localhost:3000'; // Per iOS emulator/Dispositivo fisico (vedi note sotto)

export const AuthService = {
  async register(email, password, userType) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, userType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return await response.json();

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return { success: true, user: data.user, token: data.token }; // Assicurati che il backend restituisca un token

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Aggiungi altri metodi se necessario (logout, etc.)
};
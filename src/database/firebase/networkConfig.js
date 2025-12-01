import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configurazione manuale dell'IP del PC per sviluppo
 */
export class NetworkConfig {
  static STORAGE_KEY = '@dev_pc_ip';

  /**
   * Imposta manualmente l'IP del PC
   */
  static async setManualPcIp(ip) {
    try {
      if (!this.validateIp(ip)) {
        throw new Error('IP non valido');
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, ip);
      console.log(`[NetworkConfig] IP manuale impostato: ${ip}`);
      return true;
    } catch (error) {
      console.error('[NetworkConfig] Errore impostazione IP:', error);
      return false;
    }
  }

  /**
   * Ottieni l'IP manualmente configurato
   */
  static async getManualPcIp() {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('[NetworkConfig] Errore lettura IP:', error);
      return null;
    }
  }

  /**
   * Resetta l'IP configurato
   */
  static async resetPcIp() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('[NetworkConfig] IP resettato');
      return true;
    } catch (error) {
      console.error('[NetworkConfig] Errore reset IP:', error);
      return false;
    }
  }

  /**
   * Valida formato IP
   */
  static validateIp(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  /**
   * Suggerisci IP basato sulla subnet corrente
   */
  static suggestIps(currentIp) {
    if (!currentIp || !currentIp.includes('.')) {
      return ['192.168.1.100', '192.168.0.100', '10.0.2.2'];
    }

    const base = currentIp.split('.').slice(0, 3).join('.');
    return [
      `${base}.1`,    // Router
      `${base}.100`,  // PC comune
      `${base}.50`,   // Altro
      `${base}.254`,  // Ultimo
      '10.0.2.2',     // Emulatore
    ];
  }
}
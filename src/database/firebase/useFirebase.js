import { useState, useEffect } from 'react';
import { getFirebase, checkHealth, getFirebaseInfo } from './firebaseConfig';

/**
 * Hook React per usare Firebase nei componenti
 */
export const useFirebase = () => {
  const [firebase, setFirebase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const fb = await getFirebase();

        if (mounted) {
          setFirebase(fb);
          setError(null);

          // Check iniziale salute
          const initialHealth = await checkHealth();
          setHealth(initialHealth);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useFirebase] Errore inizializzazione:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Health check periodico
    const healthInterval = setInterval(async () => {
      if (mounted && firebase) {
        const newHealth = await checkHealth();
        setHealth(newHealth);
      }
    }, 60000); // Ogni minuto

    return () => {
      mounted = false;
      clearInterval(healthInterval);
    };
  }, []);

  return {
    // Stato
    firebase,
    loading,
    error,
    health,

    // Servizi (convenience accessors)
    auth: firebase?.auth,
    db: firebase?.db,
    functions: firebase?.functions,
    storage: firebase?.storage,

    // Info
    isEmulator: firebase?.isEmulator,
    usingEmulators: firebase?.usingEmulators,
    networkState: firebase?.networkState,

    // Metodi
    refreshHealth: async () => {
      const newHealth = await checkHealth();
      setHealth(newHealth);
      return newHealth;
    },

    // Helper per UI
    getStatus: () => {
      if (loading) return 'loading';
      if (error) return 'error';
      if (health?.overall === 'unhealthy') return 'unhealthy';
      return 'ready';
    },

    getStatusColor: () => {
      if (loading) return '#FFA000'; // Amber
      if (error) return '#F44336'; // Red
      if (health?.overall === 'unhealthy') return '#FF9800'; // Orange
      return '#4CAF50'; // Green
    },
  };
};

export default useFirebase;
import { useState, useEffect } from 'react';
import { getFirebase } from './firebaseConfig';

/**
 * Hook React per usare Firebase nei componenti
 */
export const useFirebase = () => {
  const [firebase, setFirebase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  const checkHealth = async (fb) => {
    try {
      if (!fb?.db) return null;
      await fb.db.collection('_healthcheck').doc('test').get();
      return { overall: 'healthy', timestamp: new Date().toISOString() };
    } catch (err) {
      return { overall: 'unhealthy', error: err.message, timestamp: new Date().toISOString() };
    }
  };

  useEffect(() => {
    let mounted = true;
    let healthTimer = null;

    const init = async () => {
      try {
        setLoading(true);

        // Ottieni servizi Firebase
        const fb = await getFirebase();

        if (!mounted) return;

        setFirebase(fb);
        setError(null);

        // Health check iniziale
        const initialHealth = await checkHealth(fb);
        setHealth(initialHealth);

        // Health check periodico
        healthTimer = setInterval(async () => {
          if (!mounted) return;
          const newHealth = await checkHealth(fb);
          setHealth(newHealth);
        }, 60000);

      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useFirebase] Errore inizializzazione:', err);
        }
      } finally {
        mounted && setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (healthTimer) clearInterval(healthTimer);
    };
  }, []); // ← IMPORTANTE: nessuna dipendenza, evita loop infinito

  const refreshHealth = async () => {
    if (!firebase) return null;
    const newHealth = await checkHealth(firebase);
    setHealth(newHealth);
    return newHealth;
  };

  const getStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (health?.overall === 'unhealthy') return 'unhealthy';
    return 'ready';
  };

  const getStatusColor = () => {
    if (loading) return '#FFA000';
    if (error) return '#F44336';
    if (health?.overall === 'unhealthy') return '#FF9800';
    return '#4CAF50';
  };

  return {
    // Stato
    firebase,
    loading,
    error,
    health,

    // Servizi Firebase (istanze già create da firebaseConfig)
    auth: firebase?.auth || null,
    db: firebase?.db || null,
    functions: firebase?.functions || null,
    storage: firebase?.storage || null,
    database: firebase?.database || null,


    // Info rete/emulatori
    isEmulator: firebase?.networkState?.isEmulator,
    usingEmulators: firebase?.networkState?.useEmulators,
    networkState: firebase?.networkState,

    // Metodi
    refreshHealth,

    // Helper UI
    getStatus,
    getStatusColor,
  };
};

export default useFirebase;


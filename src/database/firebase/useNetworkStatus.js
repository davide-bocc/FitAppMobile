// F:\Projects\FitAppMobile\src\database\firebase\useNetworkStatus.js
import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP predefinito per lo sviluppo (modifica con il tuo)
const DEFAULT_PC_IP = '192.168.1.100';

/**
 * Hook per gestire lo stato della rete e rilevare automaticamente
 * se siamo su WiFi, dati mobili, o offline
 */
export const useNetworkStatus = (options = {}) => {
  const {
    autoDiscoverPcIp = true,      // Tenta di trovare automaticamente l'IP del PC
    checkInterval = 5000,          // Intervallo di controllo (ms)
    persistPcIp = true,            // Salva l'IP trovato in AsyncStorage
    debug = __DEV__,               // Log di debug in sviluppo
  } = options;

  const [networkState, setNetworkState] = useState({
    // Stato connessione
    isConnected: true,
    isInternetReachable: true,

    // Tipo di connessione
    type: 'unknown',
    details: null,

    // Rilevamento WiFi
    isWifi: false,
    isCellular: false,
    isEthernet: false,
    isVPN: false,
    isOther: false,

    // Informazioni IP
    ipAddress: null,
    subnet: null,

    // IP del PC in sviluppo
    devPcIp: null,
    pcIpFound: false,

    // Stato server locale (emulatori)
    localServerReachable: false,

    // Metadata
    isEmulator: Platform.OS === 'android' && Platform.isTesting,
    lastUpdated: null,
    loading: true,
  });

  const appState = useRef(AppState.currentState);
  const intervalRef = useRef(null);

  /**
   * Tenta di trovare l'IP del PC sulla rete WiFi
   */
  const discoverPcIp = async () => {
    if (!autoDiscoverPcIp || !networkState.isWifi) {
      return DEFAULT_PC_IP;
    }

    try {
      // 1. Prima controlla se abbiamo un IP salvato
      const savedIp = await AsyncStorage.getItem('@dev_pc_ip');
      if (savedIp) {
        if (debug) console.log('[Network] Usando IP salvato:', savedIp);
        return savedIp;
      }

      // 2. Tentativo di discovery basato sulla subnet
      if (networkState.ipAddress && networkState.subnet) {
        // Genera IP potenziali basati sulla subnet
        const baseIp = networkState.ipAddress.split('.').slice(0, 3).join('.');
        const potentialIps = [
          `${baseIp}.1`,    // Router tipico
          `${baseIp}.100`,  // PC comune
          `${baseIp}.50`,   // Altro comune
          `${baseIp}.254`,  // Ultimo indirizzo
        ];

        // Aggiungi IP predefinito
        potentialIps.push(DEFAULT_PC_IP);

        // Testa ogni IP
        for (const ip of potentialIps) {
          const isReachable = await testPing(ip, 8081); // Porta Metro
          if (isReachable) {
            if (persistPcIp) {
              await AsyncStorage.setItem('@dev_pc_ip', ip);
            }
            if (debug) console.log('[Network] PC IP trovato:', ip);
            return ip;
          }
        }
      }

      // 3. Fallback all'IP predefinito
      if (debug) console.log('[Network] Usando IP predefinito:', DEFAULT_PC_IP);
      return DEFAULT_PC_IP;
    } catch (error) {
      if (debug) console.warn('[Network] Errore discovery IP:', error);
      return DEFAULT_PC_IP;
    }
  };

  /**
   * Testa se un host è raggiungibile
   */
  const testPing = async (host, port) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`http://${host}:${port}/status`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  /**
   * Verifica se il server locale (emulatori) è raggiungibile
   */
  const checkLocalServer = async () => {
    if (!networkState.isWifi && !networkState.isEmulator) {
      return false;
    }

    try {
      let host;
      if (networkState.isEmulator) {
        host = '10.0.2.2'; // Emulatore Android
      } else if (networkState.devPcIp) {
        host = networkState.devPcIp;
      } else {
        host = await discoverPcIp();
      }

      // Testa vari servizi
      const ports = [
        { port: 8081, service: 'Metro' },
        { port: 8080, service: 'Firestore' },
        { port: 5001, service: 'Functions' },
        { port: 9099, service: 'Auth' },
      ];

      const results = await Promise.all(
        ports.map(async ({ port, service }) => ({
          service,
          port,
          reachable: await testPing(host, port),
        }))
      );

      const reachableServices = results.filter(r => r.reachable);
      const isReachable = reachableServices.length > 0;

      if (debug && isReachable) {
        console.log('[Network] Server locali raggiungibili:',
          reachableServices.map(r => `${r.service}:${r.port}`).join(', '));
      }

      return isReachable;
    } catch (error) {
      if (debug) console.warn('[Network] Errore controllo server:', error);
      return false;
    }
  };

  /**
   * Aggiorna lo stato della rete
   */
  const updateNetworkStatus = async (state) => {
    try {
      const isEmulator = Platform.OS === 'android' && Platform.isTesting;

      // Informazioni base
      const newState = {
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type || 'unknown',
        details: state.details || null,

        // Tipo di connessione
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isEthernet: state.type === 'ethernet',
        isVPN: state.type === 'vpn',
        isOther: !['wifi', 'cellular', 'ethernet', 'vpn'].includes(state.type),

        // IP e subnet
        ipAddress: state.details?.ipAddress || null,
        subnet: state.details?.subnet || null,

        // Stato emulatore
        isEmulator,

        // Metadata
        lastUpdated: new Date(),
        loading: false,
      };

      // Se siamo su WiFi, cerca l'IP del PC
      if (newState.isWifi && autoDiscoverPcIp) {
        newState.devPcIp = await discoverPcIp();
        newState.pcIpFound = !!newState.devPcIp;

        // Verifica server locali
        newState.localServerReachable = await checkLocalServer();
      } else if (isEmulator) {
        // Emulatore - IP fisso
        newState.devPcIp = '10.0.2.2';
        newState.pcIpFound = true;
        newState.localServerReachable = await checkLocalServer();
      } else {
        // Dati mobili o altro - non usare server locali
        newState.devPcIp = null;
        newState.pcIpFound = false;
        newState.localServerReachable = false;
      }

      if (debug) {
        console.log('[Network] Stato aggiornato:', {
          type: newState.type,
          ip: newState.ipAddress,
          pcIp: newState.devPcIp,
          serverReachable: newState.localServerReachable,
        });
      }

      setNetworkState(prev => ({ ...prev, ...newState }));
    } catch (error) {
      console.error('[Network] Errore aggiornamento stato:', error);
    }
  };

  /**
   * Forza un refresh dello stato
   */
  const refresh = async () => {
    try {
      const state = await NetInfo.fetch();
      await updateNetworkStatus(state);
    } catch (error) {
      console.error('[Network] Errore refresh:', error);
    }
  };

  /**
   * Ottieni l'host corretto per gli emulatori in base alla connessione
   */
  const getEmulatorHost = () => {
    if (networkState.isEmulator) {
      return '10.0.2.2';
    }

    if (networkState.isWifi && networkState.localServerReachable) {
      return networkState.devPcIp;
    }

    return null; // Usa Firebase Cloud
  };

  /**
   * Determina se usare emulatori o Firebase Cloud
   */
  const shouldUseEmulators = () => {
    return __DEV__ &&
           networkState.isConnected &&
           (networkState.isEmulator ||
            (networkState.isWifi && networkState.localServerReachable));
  };

  // Effetto principale per il listener della rete
  useEffect(() => {
    let isMounted = true;

    const setupNetworkListener = async () => {
      // Stato iniziale
      const initialState = await NetInfo.fetch();
      if (isMounted) {
        await updateNetworkStatus(initialState);
      }

      // Listener per cambiamenti
      const unsubscribe = NetInfo.addEventListener(async (state) => {
        if (isMounted) {
          await updateNetworkStatus(state);
        }
      });

      // Refresh periodico (utile per verificare server locali)
      intervalRef.current = setInterval(async () => {
        if (isMounted && networkState.isWifi) {
          const state = await NetInfo.fetch();
          if (isMounted) {
            await updateNetworkStatus(state);
          }
        }
      }, checkInterval);

      // Listener per stato app
      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (isMounted &&
            appState.current.match(/inactive|background/) &&
            nextAppState === 'active') {
          refresh();
        }
        appState.current = nextAppState;
      });

      return () => {
        unsubscribe();
        if (intervalRef.current) clearInterval(intervalRef.current);
        appStateSubscription.remove();
      };
    };

    const cleanupPromise = setupNetworkListener();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []);

  // Metodi esposti dall'hook
  return {
    // Stato attuale
    ...networkState,

    // Metodi
    refresh,
    getEmulatorHost,
    shouldUseEmulators,

    // Helper per UI
    getConnectionLabel: () => {
      if (!networkState.isConnected) return 'Offline';
      if (!networkState.isInternetReachable) return 'No Internet';
      if (networkState.isWifi) return `WiFi${networkState.localServerReachable ? ' (Dev)' : ''}`;
      if (networkState.isCellular) return 'Dati mobili';
      if (networkState.isEthernet) return 'Ethernet';
      return 'Connesso';
    },

    // Helper per colori UI
    getConnectionColor: () => {
      if (!networkState.isConnected) return '#ff4444'; // Rosso
      if (!networkState.isInternetReachable) return '#ff8800'; // Arancione
      if (networkState.isWifi && networkState.localServerReachable) return '#00C853'; // Verde (dev)
      if (networkState.isWifi) return '#4CAF50'; // Verde chiaro
      if (networkState.isCellular) return '#2196F3'; // Blu
      return '#757575'; // Grigio
    },

    // Per debug
    debugInfo: debug ? {
      rawState: networkState,
      timestamp: new Date().toISOString(),
    } : null,
  };
};

/**
 * Hook semplificato per ottenere solo l'host degli emulatori
 */
export const useEmulatorHost = () => {
  const { getEmulatorHost, shouldUseEmulators } = useNetworkStatus({
    autoDiscoverPcIp: true,
    debug: false,
  });

  return {
    host: getEmulatorHost(),
    shouldUseEmulators: shouldUseEmulators(),
  };
};

export default useNetworkStatus;
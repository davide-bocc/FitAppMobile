import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Versione base
export const checkNetworkStatus = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// Hook per React components
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
};

// Gestione connessione con timeout
export const checkNetworkWithTimeout = (timeout = 5000) => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(false), timeout);

    NetInfo.fetch().then(state => {
      clearTimeout(timeoutId);
      resolve(state.isConnected ?? false);
    });
  });
};

// Tipi di connessione
export const getConnectionInfo = async () => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected,
    type: state.type,
    isWifi: state.type === 'wifi',
    isCellular: state.type === 'cellular',
    details: state.details
  };
};
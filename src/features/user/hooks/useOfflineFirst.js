import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import LocalDB from '../../../database/local/LocalDB';
import { checkNetworkStatus } from '../../../utils/network';

export default function useOfflineFirst(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (forceRemote = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Prima cerca in locale se non forzato
      if (!forceRemote) {
        const localData = await LocalDB.find(collectionName);
        if (localData.length > 0) {
          setData(localData);
          setLoading(false);
        }
      }

      // 2. Se online, cerca aggiornamenti
      if (await checkNetworkStatus()) {
        const snapshot = await getDocs(collection(db, collectionName));
        const remoteData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 3. Aggiorna cache locale
        await LocalDB.bulkInsert(collectionName, remoteData);
        setData(remoteData);
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName]);

  const retry = () => fetchData(true);

  return { data, loading, error, retry };
}
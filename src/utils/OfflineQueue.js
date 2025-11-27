import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineQueue = {
  async add(key, item) {
    try {
      const existing = await AsyncStorage.getItem(key);
      const queue = existing ? JSON.parse(existing) : [];
      queue.push(item);
      await AsyncStorage.setItem(key, JSON.stringify(queue));
    } catch (e) {
      console.error('OfflineQueue add error:', e);
    }
  },

  async processPending(key) {
    try {
      const existing = await AsyncStorage.getItem(key);
      if (!existing) return;
      const queue = JSON.parse(existing);

      // Qui puoi aggiungere logica di sincronizzazione reale, per ora solo reset
      console.log(`Processing ${queue.length} pending items for ${key}`);
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('OfflineQueue processPending error:', e);
    }
  }
};

export default OfflineQueue;

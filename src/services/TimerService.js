import { Audio } from 'expo-av';

export default class TimerService {
  static timers = new Map();

  static async startTimer(duration, onTick, onComplete) {
    return new Promise((resolve) => {
      let remaining = duration;

      const timerId = setInterval(async () => {
        remaining -= 1;
        onTick?.(remaining);

        if (remaining <= 0) {
          clearInterval(timerId);
          this.timers.delete(timerId);

          await this.playSound();

          onComplete?.();
          resolve();
        }
      }, 1000);

      this.timers.set(timerId, { remaining });
    });
  }

  static stopAllTimers() {
    this.timers.forEach((_, timerId) => clearInterval(timerId));
    this.timers.clear();
  }

  // 🔹 Play beep di sistema Android
  static async playSound() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'android.resource://android/raw/notification' },
        { shouldPlay: true }
      );

      // rilascia il suono dopo la riproduzione
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

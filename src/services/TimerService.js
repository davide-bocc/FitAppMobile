import Sound from 'react-native-sound';

export default class TimerService {
  static timers = new Map();

  static async startTimer(duration, onTick, onComplete) {
    return new Promise((resolve) => {
      let remaining = duration;

      const timerId = setInterval(() => {
        remaining -= 1;
        onTick?.(remaining);

        if (remaining <= 0) {
          clearInterval(timerId);
          this.timers.delete(timerId);
          this.playSound();
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

  static playSound() {
    const sound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (!error) sound.play();
    });
  }
}
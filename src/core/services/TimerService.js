import Sound from 'react-native-sound';
import { Alert } from 'react-native';
import { checkNetworkStatus } from '../../utils/network';

export class TimerService {
  static timerIds = new Set();

  static async startRestTimer(seconds) {
    return new Promise((resolve) => {
      const timerId = setTimeout(() => {
        this.playCompletionSound();
        this.timerIds.delete(timerId);
        resolve();
      }, seconds * 1000);

      this.timerIds.add(timerId);
    });
  }

  static cancelAllTimers() {
    this.timerIds.forEach(timerId => clearTimeout(timerId));
    this.timerIds.clear();
  }

  private static playCompletionSound() {
    if (!checkNetworkStatus()) {
      Alert.alert('Rest Time Over');
      return;
    }

    const sound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (!error) sound.play();
    });
  }
}
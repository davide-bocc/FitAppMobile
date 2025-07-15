import { Alert } from 'react-native';
import Sound from 'react-native-sound';

export class TimerService {
  static async startRestTimer(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = seconds;

      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(interval);
          this.playCompletionSound();
          resolve();
        }
      }, 1000);
    });
  }

  private static playCompletionSound(): void {
    const sound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (!error) {
        sound.play();
      }
    });
  }
}
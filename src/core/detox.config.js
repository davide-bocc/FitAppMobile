module.exports = {
  configurations: {
    "android.emu.debug": {
      device: {
        type: "android.emulator",
        avdName: "Pixel_4_API_30" // Sostituisci con il nome del tuo AVD
      },
      app: {
        type: "android.apk",
        binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
        build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .."
      },
      behavior: {
        launchApp: "auto",
        terminateApp: true
      }
    }
  }
};
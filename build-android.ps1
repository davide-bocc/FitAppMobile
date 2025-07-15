# build-android.ps1
$ErrorActionPreference = "Stop"

# Crea cartella assets
if (!(Test-Path "android\app\src\main\assets")) {
  New-Item -ItemType Directory -Path "android\app\src\main\assets"
}

# Genera bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# Build APK
Push-Location android
try {
  .\gradlew assembleDebug
} finally {
  Pop-Location
}
module.exports = {
  project: {
    android: { packageName: "fit.app.mobile" },
    ios: {},
  },
  dependencies: {
    'react-native-quick-sqlite': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-quick-sqlite/android',
          packageImportPath: 'import com.surespot.sqlite.SQLitePackage;',
        },
        ios: {
          podspecPath: '../node_modules/react-native-quick-sqlite/react-native-quick-sqlite.podspec',
        },
      },
    },
    '@react-native-firebase/app': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/app/android',
          packageImportPath: 'import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;',
        },
        ios: {
          podspecPath: '../node_modules/@react-native-firebase/app/ReactNativeFirebase.podspec',
        },
      },
    },
    '@react-native-firebase/auth': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/auth/android',
          packageImportPath: 'import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;',
        },
        ios: {
          podspecPath: '../node_modules/@react-native-firebase/auth/ReactNativeFirebaseAuth.podspec',
        },
      },
    },
    '@react-native-firebase/firestore': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/firestore/android',
          packageImportPath: 'import io.invertase.firebase.firestore.ReactNativeFirebaseFirestorePackage;',
        },
        ios: {
          podspecPath: '../node_modules/@react-native-firebase/firestore/ReactNativeFirebaseFirestore.podspec',
        },
      },
    },
  },
};


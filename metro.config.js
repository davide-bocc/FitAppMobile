const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false, // disabilitato per Firebase su Windows
      },
    }),
  },
  resolver: {
    alias: {
      'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
    blockList: exclusionList([
      /.*\/__tests__\/.*/,
      /.*\/\.git\/.*/,
      /.*\/\.vscode\/.*/,
    ]),
    extraNodeModules: {
      '@react-native-firebase/functions': path.resolve(__dirname, 'node_modules/@react-native-firebase/functions/lib'),
      'react-native/js-polyfills': path.resolve(__dirname, 'node_modules/@react-native/js-polyfills'), // 🔹 aggiunto
    },
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules/@react-native-firebase/functions/lib'),
    path.resolve(__dirname, 'node_modules/@react-native/js-polyfills'), // 🔹 aggiunto
  ],
});
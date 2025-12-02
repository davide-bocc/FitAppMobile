const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
    blockList: exclusionList([]),
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules/@react-native/js-polyfills'),
  ],
});

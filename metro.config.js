const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    alias: {
      'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    blockList: exclusionList([
      /.*\/__tests__\/.*/,
      /.*\/\.git\/.*/,
      /.*\/\.vscode\/.*/,
      /node_modules\/firebase\/node_modules\/.*/,
      /node_modules\/@react-native-async-storage\/async-storage\/android\/.*/,
      /.*\/build\/.*/,
      /.*\/dist\/.*/,
      /.*\/\.gradle\/.*/,
      /.*\/tmp\/.*/,
    ]),
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
});
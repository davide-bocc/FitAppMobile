const { getDefaultConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    blockList: exclusionList([
      /.*[\/\\]android[\/\\]build[\/\\].*/,
      /.*[\/\\]android[\/\\]app[\/\\]build[\/\\].*/,
      /.*\.temp-stream-.*$/
    ]),
  },
  watchFolders: [],
};

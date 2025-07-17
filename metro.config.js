const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    transformer: {
      ...defaultConfig.transformer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      ...defaultConfig.resolver,
      sourceExts: [...new Set([...defaultConfig.resolver.sourceExts, 'jsx', 'ts', 'tsx'])],
      extraNodeModules: require('node-libs-react-native'),
    },
  };
})();


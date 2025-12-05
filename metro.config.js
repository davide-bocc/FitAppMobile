const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Risolutore custom per memoize-one (evita problemi con SHA-1)
function customResolveRequest(context, moduleName, platform) {
  if (moduleName === 'memoize-one') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/memoize-one/dist/memoize-one.cjs.js'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
}

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
    ...defaultConfig.resolver,
    resolveRequest: customResolveRequest,

    // Alias per evitare conflitti di versione
    alias: {
      'react-native-reanimated': path.resolve(
        __dirname,
        'node_modules/react-native-reanimated'
      ),
    },

    // Estensioni supportate (aggiunte cjs per memoize-one)
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      'cjs',
      'cjs.js',
      'cjs.jsx',
      'js',
      'jsx',
    ],

    // Blocklist minima per evitare esclusioni errate
    blockList: exclusionList([
      /.*\/__tests__\/.*/,
      /.*\/\.git\/.*/,
      /.*\/\.vscode\/.*/,
      /.*\/\.gradle\/.*/,
      /.*\/tmp\/.*/,
    ]),
  },

  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, 'node_modules/@react-native'),
  ],
});



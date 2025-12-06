const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Resolver custom per memoize-one e js-polyfills/console
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
  if (moduleName === '@react-native/js-polyfills/console') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@react-native/js-polyfills/console.js'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
}

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: false },
    }),
  },
  resolver: {
    ...defaultConfig.resolver,

    resolveRequest: customResolveRequest,

    // Blocklist minima: solo cartelle che vogliamo davvero escludere
    blockList: exclusionList([
      /.*\/__tests__\/.*/,
      /.*\/\.git\/.*/,
      /.*\/\.vscode\/.*/,
      /.*\/\.gradle\/.*/,
      /.*\/tmp\/.*/,
    ]),

    // Alias per evitare conflitti di versioni
    alias: {
      'react-native-reanimated': path.resolve(
        __dirname,
        'node_modules/react-native-reanimated'
      ),
    },

    // Estensioni supportate
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      'cjs',
      'cjs.js',
      'cjs.jsx',
      'js',
      'jsx',
    ],
  },

  // Watch folders: node_modules e il percorso problematico di js-polyfills
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, 'node_modules/@react-native'),
    path.resolve(__dirname, 'node_modules/@react-native/js-polyfills'),
  ],
});


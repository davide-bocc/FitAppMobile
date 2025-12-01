module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'react-native-reanimated/plugin',
      {
        relativeSourceLocation: true,
      },
    ],
    // Supporto per class private methods
    ['@babel/plugin-proposal-private-methods', { loose: true }],
  ],
};

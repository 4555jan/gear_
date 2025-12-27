module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@pages': './src/pages',
        '@services': './src/services',
        '@stores': './src/stores',
        '@utils': './src/utils',
        '@assets': './src/assets'
      }
    }]
  ]
};
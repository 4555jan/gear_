/**
 * Metro configuration for React Native
 * https://facebook.github.io/metro/docs/configuration
 */

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
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
      '@': './src',
      '@components': './src/components',
      '@pages': './src/pages', 
      '@services': './src/services',
      '@stores': './src/stores',
      '@utils': './src/utils',
      '@assets': './src/assets'
    },
    platforms: ['native', 'android', 'ios', 'web']
  }
};

module.exports = mergeConfig(defaultConfig, config);
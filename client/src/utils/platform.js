import { Platform, Dimensions } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = Platform.OS !== 'web';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1200
};

// Check if screen size matches breakpoint
export const isScreenSize = (breakpoint) => {
  return screenWidth >= BREAKPOINTS[breakpoint];
};

// Responsive dimensions
export const responsive = {
  width: (percent) => screenWidth * (percent / 100),
  height: (percent) => screenHeight * (percent / 100),
  fontSize: (size) => {
    if (screenWidth < BREAKPOINTS.sm) return size * 0.9;
    if (screenWidth < BREAKPOINTS.md) return size * 0.95;
    return size;
  },
  padding: (size) => {
    if (screenWidth < BREAKPOINTS.sm) return size * 0.8;
    if (screenWidth < BREAKPOINTS.md) return size * 0.9;
    return size;
  }
};

// Platform-specific styles
export const platformStyles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }
  }),
  borderRadius: Platform.select({
    ios: 8,
    android: 4,
    web: 6
  }),
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    web: 64
  })
};

// Safe area handling
export const safeArea = {
  top: Platform.select({
    ios: 44,
    android: 0,
    web: 0
  }),
  bottom: Platform.select({
    ios: 34,
    android: 0,
    web: 0
  })
};

export default {
  isWeb,
  isIOS,
  isAndroid,
  isMobile,
  responsive,
  platformStyles,
  safeArea,
  BREAKPOINTS,
  isScreenSize
};
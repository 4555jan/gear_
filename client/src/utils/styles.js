import { StyleSheet } from 'react-native';
import { responsive, platformStyles } from './platform';

// Color palette
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  green: {
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a'
  },
  yellow: {
    100: '#fef3c7',
    500: '#eab308',
    600: '#ca8a04'
  },
  red: {
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626'
  },
  blue: {
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb'
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent'
};

// Typography
export const typography = {
  xs: responsive.fontSize(12),
  sm: responsive.fontSize(14),
  base: responsive.fontSize(16),
  lg: responsive.fontSize(18),
  xl: responsive.fontSize(20),
  '2xl': responsive.fontSize(24),
  '3xl': responsive.fontSize(30),
  '4xl': responsive.fontSize(36)
};

// Spacing
export const spacing = {
  xs: responsive.padding(4),
  sm: responsive.padding(8),
  md: responsive.padding(16),
  lg: responsive.padding(24),
  xl: responsive.padding(32),
  '2xl': responsive.padding(48)
};

// Common styles
export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.gray[50]
  },
  row: {
    flexDirection: 'row'
  },
  column: {
    flexDirection: 'column'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  spaceBetween: {
    justifyContent: 'space-between'
  },
  flexWrap: {
    flexWrap: 'wrap'
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: platformStyles.borderRadius,
    padding: spacing.md,
    marginVertical: spacing.xs,
    ...platformStyles.shadow
  },
  cardHeader: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.sm
  },
  cardBody: {
    flex: 1
  },

  // Buttons
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: platformStyles.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...platformStyles.shadow
  },
  buttonPrimary: {
    backgroundColor: colors.primary[600]
  },
  buttonSecondary: {
    backgroundColor: colors.gray[200],
    borderWidth: 1,
    borderColor: colors.gray[300]
  },
  buttonSuccess: {
    backgroundColor: colors.green[600]
  },
  buttonWarning: {
    backgroundColor: colors.yellow[500]
  },
  buttonDanger: {
    backgroundColor: colors.red[600]
  },
  buttonText: {
    fontSize: typography.base,
    fontWeight: '600'
  },
  buttonTextPrimary: {
    color: colors.white
  },
  buttonTextSecondary: {
    color: colors.gray[700]
  },

  // Input fields
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: platformStyles.borderRadius,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.base,
    backgroundColor: colors.white,
    minHeight: 44
  },
  inputFocused: {
    borderColor: colors.primary[500],
    ...platformStyles.shadow
  },
  inputError: {
    borderColor: colors.red[500]
  },
  label: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.red[600],
    marginTop: spacing.xs
  },

  // Typography
  title: {
    fontSize: typography['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900]
  },
  subtitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.gray[800]
  },
  body: {
    fontSize: typography.base,
    color: colors.gray[600],
    lineHeight: typography.base * 1.5
  },
  caption: {
    fontSize: typography.sm,
    color: colors.gray[500]
  },

  // Badges
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: platformStyles.borderRadius,
    alignSelf: 'flex-start'
  },
  badgePrimary: {
    backgroundColor: colors.primary[100]
  },
  badgeSuccess: {
    backgroundColor: colors.green[100]
  },
  badgeWarning: {
    backgroundColor: colors.yellow[100]
  },
  badgeError: {
    backgroundColor: colors.red[100]
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: '600'
  },
  badgeTextPrimary: {
    color: colors.primary[700]
  },
  badgeTextSuccess: {
    color: colors.green[600]
  },
  badgeTextWarning: {
    color: colors.yellow[600]
  },
  badgeTextError: {
    color: colors.red[600]
  },

  // Spacing utilities
  mt1: { marginTop: spacing.xs },
  mt2: { marginTop: spacing.sm },
  mt3: { marginTop: spacing.md },
  mt4: { marginTop: spacing.lg },
  mb1: { marginBottom: spacing.xs },
  mb2: { marginBottom: spacing.sm },
  mb3: { marginBottom: spacing.md },
  mb4: { marginBottom: spacing.lg },
  ml1: { marginLeft: spacing.xs },
  ml2: { marginLeft: spacing.sm },
  ml3: { marginLeft: spacing.md },
  mr1: { marginRight: spacing.xs },
  mr2: { marginRight: spacing.sm },
  mr3: { marginRight: spacing.md },
  p1: { padding: spacing.xs },
  p2: { padding: spacing.sm },
  p3: { padding: spacing.md },
  p4: { padding: spacing.lg },
  px1: { paddingHorizontal: spacing.xs },
  px2: { paddingHorizontal: spacing.sm },
  px3: { paddingHorizontal: spacing.md },
  py1: { paddingVertical: spacing.xs },
  py2: { paddingVertical: spacing.sm },
  py3: { paddingVertical: spacing.md }
});

export default {
  colors,
  typography,
  spacing,
  commonStyles
};
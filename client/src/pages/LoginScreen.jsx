import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useAuthStore } from '../stores/authStore';
import { commonStyles, colors, spacing, typography } from '../utils/styles';
import { responsive } from '../utils/platform';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      showMessage({
        message: 'Please fill in all fields',
        type: 'danger',
      });
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      showMessage({
        message: 'Welcome back!',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: error.message || 'Login failed',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@example.com', password: 'admin123' },
    { role: 'Technician', email: 'tech@example.com', password: 'tech123' },
    { role: 'Employee', email: 'employee@example.com', password: 'emp123' },
  ];

  const handleDemoLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <KeyboardAvoidingView 
      style={commonStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enterprise CMMS</Text>
          <Text style={styles.subtitle}>Maintenance Management System</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign In</Text>
          
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Email Address</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Password</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonPrimary, styles.loginButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonTextPrimary]}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Accounts</Text>
          <Text style={styles.demoSubtitle}>Click to use demo credentials</Text>
          
          {demoAccounts.map((account, index) => (
            <TouchableOpacity
              key={index}
              style={[commonStyles.button, commonStyles.buttonSecondary, styles.demoButton]}
              onPress={() => handleDemoLogin(account)}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonTextSecondary]}>
                {account.role} ({account.email})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Create one here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    minHeight: responsive.height(100),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: 'bold',
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.lg,
    color: colors.gray[600],
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    fontSize: typography.base,
  },
  loginButton: {
    marginTop: spacing.lg,
    minHeight: 50,
  },
  demoSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demoTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  demoSubtitle: {
    fontSize: typography.sm,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  demoButton: {
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  registerText: {
    fontSize: typography.sm,
    color: colors.gray[600],
  },
  registerLink: {
    fontSize: typography.sm,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default LoginScreen;
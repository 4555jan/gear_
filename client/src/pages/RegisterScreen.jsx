import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Picker
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useAuthStore } from '../stores/authStore';
import { commonStyles, colors, spacing, typography } from '../utils/styles';
import { responsive } from '../utils/platform';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.name.trim()) {
      showMessage({
        message: 'Name is required',
        type: 'danger',
      });
      return;
    }

    if (!formData.email.trim()) {
      showMessage({
        message: 'Email is required',
        type: 'danger',
      });
      return;
    }

    if (!formData.password) {
      showMessage({
        message: 'Password is required',
        type: 'danger',
      });
      return;
    }

    if (formData.password.length < 6) {
      showMessage({
        message: 'Password must be at least 6 characters',
        type: 'danger',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage({
        message: 'Passwords do not match',
        type: 'danger',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });
      
      if (result.success) {
        showMessage({
          message: 'Account created successfully! Welcome to CMMS!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: error.message || 'Registration failed',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.subtitle}>Create Your Account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Register</Text>
          
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Full Name</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Email Address</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Role</Text>
            <View style={[commonStyles.input, styles.pickerContainer]}>
              <Picker
                selectedValue={formData.role}
                style={styles.picker}
                onValueChange={(value) => handleChange('role', value)}
              >
                <Picker.Item label="Employee" value="employee" />
                <Picker.Item label="Technician" value="technician" />
                <Picker.Item label="Administrator" value="admin" />
              </Picker>
            </View>
            <Text style={styles.helperText}>Select your role in the organization</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Password</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Create a password"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>Must be at least 6 characters long</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>Confirm Password</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              placeholder="Confirm your password"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonPrimary, styles.registerButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonTextPrimary]}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in here</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By creating an account, you agree to our terms of service and privacy policy.
            Contact your administrator if you need assistance.
          </Text>
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
    marginBottom: spacing.lg,
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
  pickerContainer: {
    padding: 0,
    justifyContent: 'center',
  },
  picker: {
    height: 44,
  },
  helperText: {
    fontSize: typography.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  registerButton: {
    marginTop: spacing.lg,
    minHeight: 50,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loginText: {
    fontSize: typography.sm,
    color: colors.gray[600],
  },
  loginLink: {
    fontSize: typography.sm,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  footer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  footerText: {
    fontSize: typography.xs,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: typography.xs * 1.4,
  },
});

export default RegisterScreen;
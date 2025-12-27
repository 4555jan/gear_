import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';

// Stores
import { useAuthStore } from './stores/authStore';

// Screens
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import DashboardScreen from './pages/DashboardScreen';
import TeamsScreen from './pages/TeamsScreen';
import EquipmentScreen from './pages/EquipmentScreen';
import MaintenanceScreen from './pages/MaintenanceScreen';
import ProfileScreen from './pages/ProfileScreen';

// Icons
import Icon from 'react-native-vector-icons/MaterialIcons';

// Utils
import { colors } from './utils/styles';
import { isWeb } from './utils/platform';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
const TabNavigator = () => {
  const { user } = useAuthStore();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Teams':
              iconName = 'group';
              break;
            case 'Equipment':
              iconName = 'build';
              break;
            case 'Maintenance':
              iconName = 'engineering';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      
      {user?.role !== 'employee' && (
        <Tab.Screen 
          name="Teams" 
          component={TeamsScreen}
          options={{ title: 'Teams' }}
        />
      )}
      
      <Tab.Screen 
        name="Equipment" 
        component={EquipmentScreen}
        options={{ title: 'Equipment' }}
      />
      
      <Tab.Screen 
        name="Maintenance" 
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main App Component
const App = () => {
  const { token } = useAuthStore();
  
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.primary[600]} 
      />
      
      <NavigationContainer>
        {token ? <TabNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      
      <FlashMessage position="top" />
    </>
  );
};

export default App;
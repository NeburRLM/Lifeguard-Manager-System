import React from 'react';
import { NavigationContainer, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
//import './i18n';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AppDrawer from './pages/AppDrawer'; // 🔥 Este contiene Drawer + Header
import ScreenWrapper from './pages/ScreenWrapper';
import ChangePassword from './pages/ChangePassword';
import ResetPassword from './pages/ResetPassword';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['lifeguardapp://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // otras rutas si las necesitas
    },
  },
};

export default function App() {
  return (
     <NavigationContainer
       linking={linking}
       //onReady={() => console.log('Navegación lista')}
       //onStateChange={(state) => console.log('Nuevo estado de navegación:', JSON.stringify(state))}
     >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Pantalla de Login */}
        <Stack.Screen name="Login" component={Login} />

        {/* App principal con drawer y header */}
        <Stack.Screen name="MainApp" component={AppDrawer} />
        <Stack.Screen
          name="Profile"
          children={() => <ScreenWrapper><Profile /></ScreenWrapper>}
        />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

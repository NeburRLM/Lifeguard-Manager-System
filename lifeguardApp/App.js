import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AppDrawer from './pages/AppDrawer'; // 🔥 Este contiene Drawer + Header
import ScreenWrapper from './pages/ScreenWrapper';
import ChangePassword from './pages/ChangePassword';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

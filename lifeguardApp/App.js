import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './pages/Login';
import AppDrawer from './pages/AppDrawer'; // 🔥 Este contiene Drawer + Header

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Pantalla de Login */}
        <Stack.Screen name="Login" component={Login} />

        {/* App principal con drawer y header */}
        <Stack.Screen name="MainApp" component={AppDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

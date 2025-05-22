import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AppDrawer from './pages/AppDrawer';
import ScreenWrapper from './pages/ScreenWrapper';
import ChangePassword from './pages/ChangePassword';

const Stack = createStackNavigator();


export default function App() {
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

    useEffect(() => {
      const loadLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
          if (savedLanguage) {
            await i18n.changeLanguage(savedLanguage); // Configura el idioma guardado
          }
        } catch (error) {
          console.error('Error loading selected language:', error);
        } finally {
          setIsLanguageLoaded(true); // Marcamos que el idioma está cargado
        }
      };

      loadLanguage();
    }, []);


  return (
     <NavigationContainer

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

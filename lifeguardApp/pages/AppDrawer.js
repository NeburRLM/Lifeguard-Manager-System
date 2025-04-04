import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Fichar from './Fichar';
import Cuadrante from './Cuadrante';
import Nomina from './Nomina';
import ScreenWrapper from './ScreenWrapper'; // 🔥 Esto envuelve cada pantalla con el Header fijo
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

const DashboardScreen = () => <ScreenWrapper><Dashboard /></ScreenWrapper>;
const ProfileScreen = () => <ScreenWrapper><Profile /></ScreenWrapper>;
const FicharScreen = () => <ScreenWrapper><Fichar /></ScreenWrapper>;
const CuadranteScreen = () => <ScreenWrapper><Cuadrante /></ScreenWrapper>;
const NominaScreen = () => <ScreenWrapper><Nomina /></ScreenWrapper>;

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen name="Inicio" component={DashboardScreen} />
      <Drawer.Screen name="Cuadrante" component={ProfileScreen} />
      <Drawer.Screen name="Fichar" component={DashboardScreen} />
      <Drawer.Screen name="Incidencia" component={FicharScreen} />
      <Drawer.Screen name="Nómina" component={FicharScreen} />
    </Drawer.Navigator>
  );
}
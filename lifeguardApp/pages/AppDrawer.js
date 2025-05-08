import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Fichar from './Fichar';
import Cuadrante from './Cuadrante';
import Nomina from './Nomina';
import Incidencia from './Incidencia'
import ScreenWrapper from './ScreenWrapper'; // 🔥 Esto envuelve cada pantalla con el Header fijo
import CustomDrawerContent from './CustomDrawerContent';
import { useTranslation } from 'react-i18next';

const Drawer = createDrawerNavigator();

const DashboardScreen = () => <ScreenWrapper><Dashboard /></ScreenWrapper>;
const FicharScreen = () => <ScreenWrapper><Fichar /></ScreenWrapper>;
const CuadranteScreen = () => <ScreenWrapper><Cuadrante /></ScreenWrapper>;
const IncidenciaScreen = () => <ScreenWrapper><Incidencia /></ScreenWrapper>;
const NominaScreen = () => <ScreenWrapper><Nomina /></ScreenWrapper>;
const ProfileScreen = () => <ScreenWrapper><Profile /></ScreenWrapper>;

export default function AppDrawer() {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen name="Inicio" component={DashboardScreen} options={{ title: t('drawer.home') }} />
      <Drawer.Screen name="Cuadrante" component={CuadranteScreen} options={{ title: t('drawer.schedule') }} />
      <Drawer.Screen name="Fichar" component={FicharScreen} options={{ title: t('drawer.check-in') }} />
      <Drawer.Screen name="Incidencia" component={IncidenciaScreen} options={{ title: t('drawer.incident') }} />
      <Drawer.Screen name="Nómina" component={NominaScreen} options={{ title: t('drawer.payroll') }} />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />

    </Drawer.Navigator>
  );
}
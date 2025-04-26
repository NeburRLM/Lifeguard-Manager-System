import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Constants from 'expo-constants';


const CustomDrawerContent = (props) => {
  const API_URL = Constants.expoConfig.extra.API_URL;
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const res = await fetch(`${API_URL}/employee/${userId}`);
          const data = await res.json();
          setUser(data);
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('Token');
    await AsyncStorage.removeItem('userId');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.container}>
        <View style={styles.userSection}>
          <Image
            source={require('../assets/LogoSL.png')}
            style={styles.logoSL}
          />
        </View>
        <DrawerItemList {...props} />
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp('2.5%'), // 2.5% del ancho de la pantalla
  },
  userSection: {
    alignItems: 'center',
    marginBottom: hp('2.5%'), // 2.5% del alto de la pantalla
  },
  logoSL: {
    width: wp('50%'), // 20% del ancho de la pantalla
    height: wp('20%'), // 20% del ancho de la pantalla
    borderRadius: wp('10%'), // 10% del ancho de la pantalla
    marginBottom: hp('1.25%'), // 1.25% del alto de la pantalla
  },

  signOutButton: {
    marginTop: hp('2.5%'), // 2.5% del alto de la pantalla
    backgroundColor: '#e74c3c',
    padding: wp('2.5%'), // 2.5% del ancho de la pantalla
    borderRadius: wp('1.25%'), // 1.25% del ancho de la pantalla
  },
  signOutText: {
    color: 'white',
    textAlign: 'center',
    fontSize: wp('4%'), // 4% del ancho de la pantalla
  },
});

export default CustomDrawerContent;
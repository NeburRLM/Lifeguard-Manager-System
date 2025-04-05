import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatarDropdown from './UserAvatarDropdown';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Header = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {/* Botón menú */}
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
        <Ionicons name="menu" size={wp('7%')} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Mi App</Text>

      {/* Avatar con dropdown */}
      <UserAvatarDropdown />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: hp('8%'), // Altura del 8% del alto de la pantalla
    paddingTop: hp('1.5%'), // Padding top del 1.5% del alto de la pantalla
    paddingHorizontal: wp('4%'), // Padding horizontal del 4% del ancho de la pantalla
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: wp('1%'), // Padding del 1% del ancho de la pantalla
  },
  title: {
    fontSize: wp('4.5%'), // Tamaño de fuente del 4.5% del ancho de la pantalla
    fontWeight: 'bold',
  },
});

export default Header;
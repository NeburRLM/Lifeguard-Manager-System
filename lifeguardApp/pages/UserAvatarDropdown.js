import React, { useEffect, useState, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const UserAvatarDropdown = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const res = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
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
    <View>
      <TouchableOpacity onPress={() => setShowDropdown(true)}>
        <Image
          source={
            user && user.image
              ? { uri: user.image.replace('localhost', '192.168.1.34') }
              : require('../assets/default-avatar.jpg')
          }
          style={styles.avatar}
        />
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="none"
        visible={showDropdown}
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    navigation.navigate('Profile');
                  }}
                >
                  <Ionicons name="person-circle-outline" size={20} color="black" />
                  <Text style={styles.dropdownText}>Datos personales</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    handleSignOut();
                  }}
                >
                  <Ionicons name="log-out-outline" size={20} color="red" />
                  <Text style={styles.dropdownText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: wp('8%'), // 8% del ancho de la pantalla
    height: wp('8%'), // 8% del ancho de la pantalla
    borderRadius: wp('4%'), // 4% del ancho de la pantalla
    marginRight: wp('2%'),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: hp('8%'), // 8% del alto de la pantalla
    right: wp('5%'), // 5% del ancho de la pantalla
    backgroundColor: '#fff',
    paddingVertical: hp('1%'), // 1% del alto de la pantalla
    paddingHorizontal: wp('4%'), // 5% del ancho de la pantalla
    borderRadius: wp('2%'), // 2% del ancho de la pantalla
    elevation: 5,
    zIndex: 999,
    width: wp('45%'), // 45% del ancho de la pantalla
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: hp('1%'), // 1% del alto de la pantalla
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: wp('4%'), // 4% del ancho de la pantalla
    marginLeft: wp('2%'), // 2% del ancho de la pantalla
  },
});

export default UserAvatarDropdown;
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, ImageBackground } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import Feather from 'react-native-vector-icons/Feather';

const CustomDrawerContent = (props) => {
  const API_URL = Constants.expoConfig.extra.API_URL;
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const languages = [
      { code: 'es', label: 'Español', icon: require('../assets/flags/es.png') },
      { code: 'en', label: 'English', icon: require('../assets/flags/gb.png') },
      { code: 'ca', label: 'Català', icon: require('../assets/flags/ca.png') },
    ];

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

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode); // Cambia el idioma en i18n
    setSelectedLanguage(langCode); // Actualiza el estado local del idioma
    await AsyncStorage.setItem('selectedLanguage', langCode); // Guarda el idioma seleccionado
  };

  return (
      <View style={styles.container}>
        <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer}>
          {/* Logo y usuario */}
          <View style={styles.userSection}>
            <Image source={require('../assets/LogoSL.png')} style={styles.logoSL} />
          </View>

          {/* Lista de opciones del menú */}
          <DrawerItemList {...props} />

          {/* Botón de cerrar sesión */}
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>{t('drawer.logout')}</Text>
          </TouchableOpacity>
        </DrawerContentScrollView>

        {/* Selector de idioma en la parte inferior */}
        <View style={styles.languageSection}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Image
              source={languages.find((lang) => lang.code === selectedLanguage)?.icon}
              style={styles.flagIcon}
            />
            <Text style={styles.languageText}>
              {languages.find((lang) => lang.code === selectedLanguage)?.label}
            </Text>
            <Feather name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Modal de selección de idioma */}
        <Modal
          animationType="slide"
          transparent
          visible={languageModalVisible}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setLanguageModalVisible(false)}>
            <View style={styles.modalBackground}>
              <View style={styles.languageModalContainer}>
                <Text style={styles.modalTitle}>{t('drawer.select-language')}</Text>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      handleLanguageChange(lang.code);
                      setLanguageModalVisible(false);
                    }}
                    style={styles.languageOption}
                  >
                    <Image source={lang.icon} style={styles.flagIconSmall} />
                    <Text style={styles.languageLabel}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      padding: wp('2.5%'),
    },
    userSection: {
      alignItems: 'center',
      marginBottom: hp('2.5%'),
    },
    logoSL: {
      width: wp('50%'),
      height: wp('20%'),
      borderRadius: wp('10%'),
      marginBottom: hp('1.25%'),
    },
    userName: {
      fontSize: wp('4%'),
      fontWeight: 'bold',
      color: '#333',
    },
    signOutButton: {
      marginTop: hp('2.5%'),
      backgroundColor: '#e74c3c',
      padding: wp('2.5%'),
      borderRadius: wp('1.25%'),
    },
    signOutText: {
      color: 'white',
      textAlign: 'center',
      fontSize: wp('4%'),
    },
    languageSection: {
      alignItems: 'center',
      marginBottom: hp('2%'), // Separación desde el borde inferior
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f2f2f2',
      padding: 10,
      borderRadius: 20,
      width: '60%', // Más estrecho (60% del ancho del contenedor)
      justifyContent: 'space-between',
    },
    flagIcon: {
      width: 20,
      height: 15,
      marginRight: 10,
    },
    languageText: {
      fontSize: 14,
      color: '#333',
      flex: 1,
      textAlign: 'center',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    languageModalContainer: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '80%',
      alignItems: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      width: '100%',
    },
    flagIconSmall: {
      width: 20,
      height: 15,
      marginRight: 10,
    },
    languageLabel: {
      fontSize: 16,
      color: '#333',
    },
    modalTitle: {
      fontSize: wp('5%'),
      fontWeight: 'bold',
      marginBottom: hp('2%'),
    },
  });

  export default CustomDrawerContent;
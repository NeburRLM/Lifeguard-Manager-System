import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ImageBackground, Modal, Image, TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const API_URL = Constants.expoConfig.extra.API_URL;
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [recoveryDNI, setRecoveryDNI] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const navigation = useNavigation();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('Token');
      if (token) {
        navigation.navigate('MainApp');
      }
    };
    checkToken();
  }, [navigation]);

  const handleSubmit = async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/login_app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('Token', data.Token);
        await AsyncStorage.setItem('userId', id);
        navigation.replace('MainApp');
      } else {
        if (data.message === "Empleado no encontrado.") {
            setError(t("login.error-employee"));
        } else if (data.message === "Error, la contraseña no es correcta.") {
            setError(t("login.error-password"));
        } else if (data.message === "No tienes acceso al sistema.") {
            setError(t("login.error-access"));
        } else if (data.message === "Id y contraseña son requeridos.") {
            setError(t("login.error-required"));
        } else {
            setError(t("login.access-error"));
        }
      }
    } catch (error) {
      setError(t("login.server-error"));
    }
  };

  const handleForgotPassword = async () => {
    setModalMessage('');
    setModalError('');

    if (!recoveryDNI.trim()) {
      setModalError(t("login.recoveryDNI"));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/employee/${recoveryDNI}`);
      const data = await response.json();

      if (!response.ok || !data.email) {
        setModalError(t("login.find-error"));
        return;
      }

      const forgotResponse = await fetch(`${API_URL}/employee/forgot-passwordApp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         'Accept-Language': i18n.language
        },
        body: JSON.stringify({ email: data.email }),
      });

      const forgotData = await forgotResponse.json();

      if (forgotResponse.ok) {
        setModalMessage(t("login.email-send"));
        setTimeout(() => closeModal(), 1500);
      } else {
        setModalError(forgotData.message || t("login.error-email-send"));
      }
    } catch (error) {
      setModalError(t("login.server-error"));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setRecoveryDNI('');
    setModalMessage('');
    setModalError('');
  };

  const renderPasswordInput = () => (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        textContentType="password"
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const languages = [
      { code: 'es', label: 'Español', icon: require('../assets/flags/es.png') },
      { code: 'en', label: 'English', icon: require('../assets/flags/gb.png') },
      { code: 'ca', label: 'Català', icon: require('../assets/flags/ca.png') },
    ];

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode); // Cambia el idioma en i18n
    setSelectedLanguage(langCode); // Actualiza el estado local del idioma
    await AsyncStorage.setItem('selectedLanguage', langCode); // Guarda el idioma seleccionado
  };

  return (
    <ImageBackground source={require('../assets/1.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Selector de idioma */}
                    <View style={styles.languageButtonWrapper}>
                      <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => setLanguageModalVisible(true)}
                      >
                        <Image
                          source={languages.find(lang => lang.code === selectedLanguage)?.icon}
                          style={styles.flagIcon}
                        />
                        <Text style={styles.languageText}>
                          {languages.find(lang => lang.code === selectedLanguage)?.label}
                        </Text>
                        <Feather name="chevron-down" size={16} color="#333" />
                      </TouchableOpacity>
                    </View>

          <Text style={styles.title}>{t('login.welcome')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('login.dni')}</Text>
            <TextInput
              style={styles.input}
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              keyboardType="default"
              textContentType="username"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('login.password')}</Text>
            {renderPasswordInput()}
          </View>

          <Button title="Login" onPress={handleSubmit} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.link}>{t('login.forgot')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 🔤 Modal de idiomas */}
       <Modal
              animationType="slide"
              transparent
              visible={languageModalVisible}
              onRequestClose={() => setLanguageModalVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setLanguageModalVisible(false)}>
                <View style={styles.modalBackground}>
                  <View style={styles.languageModalContainer}>
                    <Text style={styles.modalTitle}>{t('login.select-language')}</Text>
                    {languages.map(lang => (
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

      {/* 🔐 Modal de recuperación */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('login.recover-password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.input-dni')}
              value={recoveryDNI}
              onChangeText={setRecoveryDNI}
              autoCapitalize="none"
            />
            {modalError && <Text style={styles.error}>{modalError}</Text>}
            {modalMessage && <Text style={{ color: 'green', marginBottom: 10 }}>{modalMessage}</Text>}

            <Button title={t('login.send-email')} onPress={handleForgotPassword} />
            <TouchableOpacity onPress={closeModal} style={{ marginTop: 15 }}>
              <Text style={styles.link}>{t('login.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  card: {
    backgroundColor: 'white',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    width: '100%',
    maxWidth: wp('90%'),
    position: 'relative',
  },
  languageButtonWrapper: {
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f2f2f2',
      padding: 8,
      borderRadius: 20,
    },
    flagIcon: {
        width: 20,
        height: 15,
        marginRight: 8,
      },
      languageText: {
        fontSize: 14,
        color: '#333',
      },
  title: {
    marginBottom: hp('2%'),
    fontSize: wp('6%'),
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: hp('3%'),
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: hp('2%'),
  },
  label: {
    marginBottom: hp('0.5%'),
    color: '#333',
  },
  input: {
    width: '100%',
    padding: wp('2%'),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('1%'),
    marginBottom: hp('1%'),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('1%'),
    padding: wp('2%'),
    marginBottom: hp('1%'),
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    padding: 0,
  },
  footer: {
    marginTop: hp('2%'),
    alignItems: 'center',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: wp('5%'),
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    width: '100%',
    maxWidth: wp('90%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    textAlign: 'center',
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

export default Login;

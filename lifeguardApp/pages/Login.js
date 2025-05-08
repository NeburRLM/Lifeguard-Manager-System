import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ImageBackground, Modal,
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
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (error) {
      setError('Error de conexión con el servidor.');
    }
  };

  const handleForgotPassword = async () => {
    setModalMessage('');
    setModalError('');

    if (!recoveryDNI.trim()) {
      setModalError('Por favor, ingresa un DNI.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/employee/${recoveryDNI}`);
      const data = await response.json();

      if (!response.ok || !data.email) {
        setModalError('No se pudo encontrar el empleado o su correo.');
        return;
      }

      const forgotResponse = await fetch(`${API_URL}/employee/forgot-passwordApp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const forgotData = await forgotResponse.json();

      if (forgotResponse.ok) {
        setModalMessage('Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
        setTimeout(() => closeModal(), 1500);
      } else {
        setModalError(forgotData.message || 'No se pudo enviar el correo de recuperación.');
      }
    } catch (error) {
      setModalError('Error de conexión con el servidor.');
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

  return (
    <ImageBackground source={require('../assets/1.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.languageButtonWrapper}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setLanguageModalVisible(true)}
            >
              <Feather name="globe" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{t('login.welcome')}</Text>
          <Text style={styles.subtitle}>Please login to your account</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.formGroup}>
            <Text style={styles.label}>DNI</Text>
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
            <Text style={styles.label}>Password</Text>
            {renderPasswordInput()}
          </View>

          <Button title="Login" onPress={handleSubmit} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 🔤 Modal de idiomas */}
      <Modal
        animationType="fade"
        transparent
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.languageModalContainer}>
            <Text style={styles.modalTitle}>{t('login.select-language')}</Text>
            {[
              { code: 'es', label: 'Español' },
              { code: 'en', label: 'English' },
              { code: 'ca', label: 'Català' },
            ].map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  i18n.changeLanguage(lang.code);
                  setSelectedLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
                style={styles.languageOption}
              >
                <Text style={{ fontSize: 16 }}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={styles.link}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <Text style={styles.modalTitle}>Recuperar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Introduce tu DNI"
              value={recoveryDNI}
              onChangeText={setRecoveryDNI}
              autoCapitalize="none"
            />
            {modalError && <Text style={styles.error}>{modalError}</Text>}
            {modalMessage && <Text style={{ color: 'green', marginBottom: 10 }}>{modalMessage}</Text>}

            <Button title="Enviar correo" onPress={handleForgotPassword} />
            <TouchableOpacity onPress={closeModal} style={{ marginTop: 15 }}>
              <Text style={styles.link}>Cerrar</Text>
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default Login;

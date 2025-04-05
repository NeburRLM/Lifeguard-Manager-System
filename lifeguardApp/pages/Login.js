import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      const response = await fetch('http://192.168.1.34:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <ImageBackground source={require('../assets/1.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
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
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>
          <Button title="Login" onPress={handleSubmit} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Forgot Password')}>
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // or 'stretch'
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'), // 5% del ancho de la pantalla
  },
  card: {
    backgroundColor: 'white',
    padding: wp('5%'), // 5% del ancho de la pantalla
    borderRadius: wp('3%'), // 3% del ancho de la pantalla
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: wp('90%'), // 90% del ancho de la pantalla
    textAlign: 'center',
  },
  title: {
    marginBottom: hp('2%'), // 2% del alto de la pantalla
    fontSize: wp('6%'), // 6% del ancho de la pantalla
    color: '#333',
  },
  subtitle: {
    marginBottom: hp('3%'), // 3% del alto de la pantalla
    fontSize: wp('4%'), // 4% del ancho de la pantalla
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: hp('1%'), // 1% del alto de la pantalla
  },
  formGroup: {
    marginBottom: hp('2%'), // 2% del alto de la pantalla
  },
  label: {
    marginBottom: hp('0.5%'), // 0.5% del alto de la pantalla
    color: '#333',
  },
  input: {
    width: '100%',
    padding: wp('2%'), // 2% del ancho de la pantalla
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('1%'), // 1% del ancho de la pantalla
  },
  footer: {
    marginTop: hp('2%'), // 2% del alto de la pantalla
    alignItems: 'center',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default Login;
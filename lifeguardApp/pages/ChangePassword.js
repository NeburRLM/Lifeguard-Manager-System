import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';


export default function ChangePassword({ navigation, route }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const API_URL = Constants.expoConfig.extra.API_URL;
  const [validationErrors, setValidationErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [checkingCurrentPassword, setCheckingCurrentPassword] = useState(false);

  const userId = route.params?.userId;
  const token = route.params?.token;

  // VALIDACIONES EN TIEMPO REAL
  useEffect(() => {
    const errors = {};

    const { newPassword, confirmNewPassword } = passwordData;

    if (newPassword && newPassword.length < 6) {
      errors.newPassword = 'Debe tener al menos 6 caracteres.';
    } else if (newPassword && !/[a-zA-Z]/.test(newPassword)) {
      errors.newPassword = 'Debe incluir al menos una letra.';
    } else if (newPassword && !/[0-9]/.test(newPassword)) {
      errors.newPassword = 'Debe incluir al menos un número.';
    }

    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = 'Las contraseñas no coinciden.';
    }

    setValidationErrors(errors);
  }, [passwordData]);

  const handleChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const checkCurrentPassword = async () => {
    setCheckingCurrentPassword(true);
    try {
      const response = await fetch(`${API_URL}/employee/change-password/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });

      const result = await response.json();
      setCheckingCurrentPassword(false);

      if (!response.ok) throw new Error(result.message || 'Contraseña actual incorrecta');

      return true;
    } catch (err) {
      setModalMessage(err.message || 'Error al verificar la contraseña actual');
      setIsError(true);
      setModalVisible(true);
      return false;
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setModalMessage('Por favor, completa todos los campos.');
      setIsError(true);
      setModalVisible(true);
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setModalMessage('Hay errores en el formulario. Revisa los campos.');
      setIsError(true);
      setModalVisible(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/employee/change-password/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      setModalMessage('Contraseña actualizada con éxito.');
      setIsError(false);
      setModalVisible(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      setModalMessage(error.message || 'Error del servidor');
      setIsError(true);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    if (!isError) navigation.goBack();
  };

  const renderPasswordInput = (label, fieldKey, visibleKey, errorKey) => (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder={label}
          secureTextEntry={!showPassword[visibleKey]}
          value={passwordData[fieldKey]}
          onChangeText={text => handleChange(fieldKey, text)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => togglePasswordVisibility(visibleKey)}
        >
          <Ionicons
            name={showPassword[visibleKey] ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      {validationErrors[errorKey] && (
        <Text style={styles.errorText}>{validationErrors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Cambiar Contraseña</Text>

        {renderPasswordInput("Contraseña actual", "currentPassword", "current", "currentPassword")}
        {renderPasswordInput("Nueva contraseña", "newPassword", "new", "newPassword")}
        {renderPasswordInput("Confirmar nueva contraseña", "confirmNewPassword", "confirm", "confirmNewPassword")}

        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>
            {checkingCurrentPassword ? 'Verificando...' : 'Cambiar contraseña'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.passwordRules}>
          La nueva contraseña debe tener:
          {'\n'}• Mínimo 6 caracteres
          {'\n'}• Al menos 1 letra
          {'\n'}• Al menos 1 número
        </Text>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalText, { color: isError ? 'red' : 'green' }]}>
              {modalMessage}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 10,
    width: '80%',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  passwordRules: {
    marginTop: 10,
    fontSize: 13,
    color: '#555',
    textAlign: 'left',
    width: '80%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 17,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalClose: {
    color: '#007BFF',
    fontSize: 16,
  },
});

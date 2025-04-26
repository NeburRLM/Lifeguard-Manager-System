import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const Profile = () => {
  const API_URL = Constants.expoConfig.extra.API_URL;
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      const userToken = await AsyncStorage.getItem('token'); // << Añadido aquí
      setToken(userToken); // << Guardamos el token
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/employee/${userId}`);
          const employeeData = await response.json();
          setEmployee(employeeData);
        } catch (error) {
          console.error('Error fetching employee data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const openEditModal = () => {
    setFormData({
      phone_number: employee?.phone_number || '',
      email: employee?.email || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      await fetch(`${API_URL}/employee/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setEmployee(prev => ({
        ...prev,
        ...formData,
      }));
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const formatHireDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatBirthday = (dateString) => {
    if (!dateString) return '';
        const formatter = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    return formatter.format(new Date(dateString));
  };


  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Datos personales</Text>

      <Text style={styles.subHeader}>Información personal</Text>
      <View style={styles.card}>
        <Text style={styles.item}><Text style={styles.label}>Nombre y apellidos:</Text> {employee.name}</Text>
        <Text style={styles.item}><Text style={styles.label}>Documento de identidad:</Text> {employee.id}</Text>
        <Text style={styles.item}><Text style={styles.label}>Fecha de nacimiento:</Text> {formatBirthday(employee.birthdate)}</Text>
        <Text style={styles.item}><Text style={styles.label}>Fecha de contratación:</Text> {formatHireDate(employee.hire_date)}</Text>
        <Text style={styles.item}><Text style={styles.label}>Rol:</Text> {employee.role}</Text>
      </View>

      <Text style={styles.subHeader}>Datos de contacto</Text>
      <View style={styles.contactHeader}>
        <Text style={styles.contactTitle}>Datos administrativos</Text>
        <TouchableOpacity onPress={openEditModal}>
          <Text style={styles.editButton}>Modificar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.item}><Text style={styles.label}>Número móvil:</Text> {employee.phone_number}</Text>
        <Text style={styles.item}><Text style={styles.label}>Correo electrónico:</Text> {employee.email}</Text>
      </View>

      <Text style={styles.subHeader}>Contraseña</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation.navigate('ChangePassword', {
            userId: employee?.id,
            token: token, // asegúrate de que tienes el token accesible en este componente
          })}
        >
          <Text style={styles.changePasswordText}>Cambiar contraseña</Text>
        </TouchableOpacity>
      </View>


      {/* MODAL */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modificar datos</Text>
            <TextInput
              placeholder="Número móvil"
              style={styles.input}
              value={formData.phone_number}
              onChangeText={text => setFormData({ ...formData, phone_number: text })}
            />
            <TextInput
              placeholder="Correo electrónico"
              style={styles.input}
              value={formData.email}
              onChangeText={text => setFormData({ ...formData, email: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveChanges}>
                <Text style={styles.saveButton}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp('4%'),
    backgroundColor: '#fff',
  },
  header: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
  },
  subHeader: {
    fontSize: wp('5%'),
    fontWeight: '600',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
  },
  item: {
    fontSize: wp('4%'),
    marginVertical: hp('0.5%'),
  },
  label: {
    fontWeight: 'bold',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  contactTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
  },
  editButton: {
    fontSize: wp('4%'),
    color: '#007BFF',
  },
  changePasswordButton: {
    backgroundColor: '#007BFF',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  changePasswordText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('4%'),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: wp('5%'),
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: wp('3%'),
    padding: wp('5%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp('1%'),
  },
  cancelButton: {
    marginRight: wp('4%'),
    color: 'red',
  },
  saveButton: {
    color: 'green',
    fontWeight: 'bold',
  },
});

export default Profile;

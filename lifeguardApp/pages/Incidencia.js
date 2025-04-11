import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // Usamos react-native-maps
import { AppState, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const Incidencia = () => {
  const [loading, setLoading] = useState(true);
    const [employeeName, setEmployeeName] = useState('');
    const [todaySchedule, setTodaySchedule] = useState(null);

    const [formData, setFormData] = useState({
      type: '',
      description: '',
      firstName: '',
      lastName: '',
      dni: '',
      age: '',
      cityOfOrigin: '',
      countryOfOrigin: '',
      gender: '',
      language: '',
      latitude: '',
      longitude: '',
    });

  const [modalVisible, setModalVisible] = useState(false); // Estado para el modal

  const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

  useEffect(() => {
      const fetchData = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          try {
            const response = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
            const employee = await response.json();
            setEmployeeName(employee.name);

            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();

            const currentSchedule = employee.work_schedule?.find(
              ws => ws.month === currentMonth && ws.year === currentYear
            );

            if (currentSchedule) {
              const todayData = currentSchedule.schedules.find(
                s => s.date === getCurrentDate()
              );
              setTodaySchedule(todayData);
            }
          } catch (error) {
            console.error('Error al cargar datos del empleado:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchData();
    }, []);


    useFocusEffect(
      useCallback(() => {
        return () => {
          setFormData({
            type: '',
            description: '',
            firstName: '',
            lastName: '',
            dni: '',
            age: '',
            cityOfOrigin: '',
            countryOfOrigin: '',
            gender: '',
            language: '',
            latitude: '',
            longitude: '',
          });
        };
      }, [])
    );

  // Maneja la selección de ubicación en el mapa
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData((prev) => ({ ...prev, latitude, longitude }));
    setModalVisible(false); // Cerrar el modal cuando se selecciona una ubicación
  };

  const handleSubmit = async () => {
    const userId = await AsyncStorage.getItem('userId');

    if (!todaySchedule) {
          Alert.alert('No tienes turno asignado hoy.');
          return;
        }

   const required = ['type', 'description', 'firstName', 'lastName', 'dni', 'age', 'latitude', 'longitude'];
       const missing = required.filter(field => !formData[field]);
       if (missing.length > 0) {
         Alert.alert('Faltan campos obligatorios:', missing.join(', '));
         return;
       }


    const body = {
         ...formData,
         facilityId: todaySchedule.facilityId,
         reportedById: userId,
         age: parseInt(formData.age),
         latitude: parseFloat(formData.latitude),
         longitude: parseFloat(formData.longitude),
       };

    const { latitude, longitude } = formData;
    if (!latitude || !longitude) {
      Alert.alert('Por favor, selecciona una ubicación en el mapa.');
      return;
    }
    // Aquí puedes enviar los datos del formulario
        console.log('Formulario enviado con la ubicación:', formData);
        Alert.alert('Formulario enviado exitosamente');
     try {
          const res = await fetch('http://192.168.1.34:4000/incidencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            Alert.alert('Incidencia reportada con éxito');
            setFormData({
              type: '',
              description: '',
              firstName: '',
              lastName: '',
              dni: '',
              age: '',
              cityOfOrigin: '',
              countryOfOrigin: '',
              gender: '',
              language: '',
              latitude: '',
              longitude: '',
            });
          } else {
            Alert.alert('Error al enviar la incidencia');
          }
        } catch (error) {
          console.error('Error al enviar incidencia:', error);
          Alert.alert('Error de red al enviar la incidencia.');
        }
      };

    useEffect(() => {
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          setFormData({
            type: '',
            description: '',
            firstName: '',
            lastName: '',
            dni: '',
            age: '',
            cityOfOrigin: '',
            countryOfOrigin: '',
            gender: '',
            language: '',
            latitude: '',
            longitude: '',
          });
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        subscription.remove();
      };
    }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;



  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📋 Reportar Incidencia</Text>
      <Text style={styles.label}>Empleado: {employeeName}</Text>

      {todaySchedule ? (
              <Text style={styles.label}>Turno en: {todaySchedule.facilityName}</Text>
            ) : (
              <Text style={styles.noSchedule}>No tienes turno asignado hoy.</Text>
            )}

            {/* Campos del formulario */}
            {[
              ['type', 'Tipo de incidencia *'],
              ['description', 'Descripción *'],
              ['firstName', 'Nombre del afectado *'],
              ['lastName', 'Apellidos del afectado *'],
              ['dni', 'DNI del afectado *'],
              ['age', 'Edad *'],
              ['cityOfOrigin', 'Ciudad de origen'],
              ['countryOfOrigin', 'País de origen'],
              ['gender', 'Género (M/F/Otro)'],
              ['language', 'Idioma'],
            ].map(([field, label]) => (
                    <TextInput
                      key={field}
                      placeholder={label}
                      style={styles.input}
                      value={formData[field]}
                      onChangeText={text => handleChange(field, text)}
                    />
                  ))}





            {/* Botón para abrir el modal con el mapa */}
            <TouchableOpacity style={styles.selectLocationButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>📍 Seleccionar Ubicación</Text>
            </TouchableOpacity>

      <TextInput
        placeholder="Latitud *"
        style={styles.input}
        value={formData.latitude ? formData.latitude.toString() : ''}
        editable={false}
      />

      <TextInput
        placeholder="Longitud *"
        style={styles.input}
        value={formData.longitude ? formData.longitude.toString() : ''}
        editable={false}
      />



      {/* Botón para enviar el formulario */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>🚨 Enviar Incidencia</Text>
      </TouchableOpacity>

      {/* Modal con el mapa */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={handleMapPress}
            >
              {formData.latitude && formData.longitude && (
                <Marker
                  coordinate={{ latitude: formData.latitude, longitude: formData.longitude }}
                  title="Ubicación seleccionada"
                />
              )}
            </MapView>

            {/* Botón para cerrar el modal */}
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cerrar Mapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f4f8',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e1e1e',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },
  noSchedule: {
    fontSize: 16,
    marginBottom: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderColor: '#cfd8dc',
    borderWidth: 1,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectLocationButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#e53935',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
});


export default Incidencia;
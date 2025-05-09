import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // Usamos react-native-maps
import { AppState, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

const getCurrentDate = () => {
  const today = new Date();
  console.log(moment().tz('Europe/Madrid').format('YYYY-MM-DD'));
  return moment().tz('Europe/Madrid').format('YYYY-MM-DD');
};

const Incidencia = () => {
    const { t } = useTranslation();
    const API_URL = Constants.expoConfig.extra.API_URL;
    const [loading, setLoading] = useState(true);
    const [employeeName, setEmployeeName] = useState('');
    const [todaySchedule, setTodaySchedule] = useState(null);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');

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
      try {
        const userId = await AsyncStorage.getItem('userId');

        if (userId) {
          const response = await fetch(`${API_URL}/employee/${userId}`);
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
        }

        const resTypes = await fetch(`${API_URL}/incident-types`);
        const typesData = await resTypes.json();
        setIncidentTypes(typesData);

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
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
          setSelectedTypeId('');
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
          Alert.alert(t('incidencia.noScheduleAlert'));
          return;
        }

   console.log(todaySchedule)

   const required = ['type', 'description', 'firstName', 'lastName', 'dni', 'age', 'cityOfOrigin', 'countryOfOrigin', 'gender', 'language', 'latitude', 'longitude'];
       const missing = required.filter(field => !formData[field]);
       if (missing.length > 0) {
         Alert.alert(t('incidencia.requiredFieldsMissing'), missing.map(f => t(`incidencia.formLabels.${f}`)).join(', '));
         return;
       }


    const body = {
         ...formData,
         type: formData.type,
         description: formData.description,
         facilityId: todaySchedule.facilityId,
         reportedById: userId,
         firstName: formData.firstName,
         lastName: formData.lastName,
         dni: formData.dni,
         age: parseInt(formData.age),
         cityOfOrigin: formData.cityOfOrigin,
         countryOfOrigin: formData.countryOfOrigin,
         gender: formData.gender,
         language: formData.language,
         latitude: parseFloat(formData.latitude),
         longitude: parseFloat(formData.longitude),
       };

    const { latitude, longitude } = formData;
    if (!latitude || !longitude) {
      Alert.alert(t('incidencia.selectLocationError'));
      return;
    }
    // Aquí puedes enviar los datos del formulario
        //console.log('Formulario enviado con la ubicación:', formData);
        //Alert.alert('Formulario enviado exitosamente');
     try {
          const res = await fetch(`${API_URL}/incident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            Alert.alert(t('incidencia.successMessage'));
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
            setSelectedTypeId('');
          } else {
            Alert.alert(t('incidencia.errorMessage'));
          }
        } catch (error) {
          console.error('Error al enviar incidencia:', error);
          Alert.alert(t('incidencia.networkError'));
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
    <Text style={styles.title}>{t('incidencia.reportIncident')}</Text>
    <Text style={styles.label}>{t('incidencia.employee')}: {employeeName}</Text>

    {todaySchedule && (
      <Text style={styles.label}>{t('incidencia.shiftAt')}: {todaySchedule.facilityName}</Text>
    )}


    {/* Tarjeta de información si no hay horario */}
    {!todaySchedule && (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {t('incidencia.scheduleForToday', { date: getCurrentDate().split('-').reverse().join('-') })}
        </Text>
        <Text style={styles.infoText}>
          {t('incidencia.noScheduleForToday')}
        </Text>
      </View>
    )}

    {/* Formulario solo si hay turno */}
    {todaySchedule && (
      <>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTypeId}
            onValueChange={(itemValue) => {
              setSelectedTypeId(itemValue);
              const selected = incidentTypes.find(t => t.id === itemValue);
              handleChange('type', selected?.type || '');
            }}
            style={styles.picker}
          >
            <Picker.Item label={t('incidencia.selectIncidentType')} value="" />
            {incidentTypes.map((item) => (
              <Picker.Item key={item.id} label={item.type} value={item.id} />
            ))}
          </Picker>
        </View>

        {[
          ['description', t('incidencia.description')],
          ['firstName', t('incidencia.firstName')],
          ['lastName', t('incidencia.lastName')],
          ['dni', t('incidencia.dni')],
          ['age', t('incidencia.age')],
          ['cityOfOrigin', t('incidencia.cityOfOrigin')],
          ['countryOfOrigin', t('incidencia.countryOfOrigin')],
          ['gender', t('incidencia.gender')],
          ['language', t('incidencia.language')],
        ].map(([field, label]) => (
          <TextInput
            key={field}
            placeholder={label}
            style={styles.input}
            value={formData[field]}
            onChangeText={text => handleChange(field, text)}
          />
        ))}

        <TouchableOpacity style={styles.selectLocationButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>{t('incidencia.selectLocation')}</Text>
        </TouchableOpacity>

        <TextInput
          placeholder={t('incidencia.latitude')}
          style={styles.input}
          value={formData.latitude ? formData.latitude.toString() : ''}
          editable={false}
        />
        <TextInput
          placeholder={t('incidencia.longitude')}
          style={styles.input}
          value={formData.longitude ? formData.longitude.toString() : ''}
          editable={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{t('incidencia.sendIncident')}</Text>
        </TouchableOpacity>
      </>
    )}

    {/* Modal con el mapa solo si hay horario */}
    {todaySchedule && (
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
                latitude: todaySchedule.facility.latitude,
                longitude: todaySchedule.facility.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={handleMapPress}
            >
              {formData.latitude && formData.longitude && (
                <Marker
                  coordinate={{ latitude: formData.latitude, longitude: formData.longitude }}
                  title={t('incidencia.select-ubi')}
                />
              )}
            </MapView>

            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>{t('incidencia.closeMap')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )}
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#cfd8dc',
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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
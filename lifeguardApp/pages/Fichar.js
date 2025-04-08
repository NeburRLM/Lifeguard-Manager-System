import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3;
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);
  const deltaLat = toRad(coords2.latitude - coords1.latitude);
  const deltaLon = toRad(coords2.longitude - coords1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Fichar = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [canFichar, setCanFichar] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeString = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const getDayName = () => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
          const employeeData = await response.json();
          setEmployeeName(employeeData.name);

          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();
          const todayName = normalizeString(getDayName());

          const currentSchedule = employeeData.work_schedule?.find(
            ws => ws.month === currentMonth && ws.year === currentYear
          );

          if (currentSchedule) {
            const todayData = currentSchedule.schedules.find(
              s => s.date === getCurrentDate()
            );
            setTodaySchedule(todayData);
          }
        } catch (error) {
          console.error("Error fetching employee data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    let timer;

    if (todaySchedule?.start_time) {
      const updateCountdown = () => {
        const now = new Date();
        const [hours, minutes] = todaySchedule.start_time.split(':').map(Number);
        const target = new Date();
        target.setHours(hours);
        target.setMinutes(minutes);
        target.setSeconds(0);

        const diff = target - now;

        if (diff > 0) {
          const remainingHours = Math.floor(diff / (1000 * 60 * 60));
          const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const remainingSeconds = Math.floor((diff % (1000 * 60)) / 1000);

          setCountdown(
            `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
          );

          setCanFichar(diff <= 10 * 60 * 1000);
        } else {
          setCountdown('¡Es hora de fichar!');
          setCanFichar(true);
          clearInterval(timer);
        }
      };

      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    }

    return () => clearInterval(timer);
  }, [todaySchedule]);

  const handleFichar = () => setModalVisible(true);

  const handleConfirmFichar = async () => {
    if (!todaySchedule) {
      Alert.alert('Error', 'No tienes un horario asignado para hoy.');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo obtener la ubicación.');
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };
      console.log("UBIIIIIIIIII-> ",location.latitude, location.longitude)

      const facilityCoords = {
        latitude: todaySchedule.facility.latitude,
        longitude: todaySchedule.facility.longitude,
      };

      const distance = haversineDistance(location, facilityCoords);

      if (distance > 10) {
        Alert.alert('Error de ubicación', 'No estás en la ubicación correcta donde deberías estar.');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const checkInTime = new Date().toISOString();
      const formatTimeOnly = (isoString) => new Date(isoString).toISOString().split('T')[1].split('.')[0];

      const attendanceData = {
        employeeId: userId,
        check_in: formatTimeOnly(checkInTime),
        date: checkInTime.split('T')[0],
        facilityId: todaySchedule.facilityId,
        note: note,
      };

      console.log('Datos que se enviarán al servidor:', JSON.stringify(attendanceData, null, 2));

      const response = await fetch('http://192.168.1.34:4000/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Fichaje registrado correctamente.');
        setModalVisible(false);
        setNote('');
      } else {
        const errorText = await response.text();
        console.error('Respuesta del servidor:', errorText);
        Alert.alert('Error', 'Hubo un problema al registrar el fichaje.');
      }
    } catch (error) {
      console.error('Error al fichar:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación o registrar el fichaje.');
    }
  };


   const handleCheckOut = async () => {
     try {
       const userId = await AsyncStorage.getItem('userId');
       const checkOutTime = new Date().toISOString();
       const formatTimeOnly = (isoString) => new Date(isoString).toISOString().split('T')[1].split('.')[0];

       const response = await fetch(`http://192.168.1.34:4000/attendance/checkout`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           employeeId: userId,
           date: getCurrentDate(),
           check_out: formatTimeOnly(checkOutTime),
         }),
       });

       if (response.ok) {
         Alert.alert('Check-out realizado', 'Tu salida ha sido registrada correctamente.');
       } else {
         const errorText = await response.text();
         console.error('Respuesta del servidor:', errorText);
         Alert.alert('Error', 'No se pudo registrar tu check-out.');
       }
     } catch (error) {
       console.error('Error en check-out:', error);
       Alert.alert('Error', 'Hubo un problema al realizar el check-out.');
     }
   };


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bienvenido, {employeeName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Horario para hoy ({getCurrentDate()})</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : todaySchedule ? (
          <>
            <View style={styles.row}><Icon name="time-outline" size={20} color="#007AFF" style={styles.icon} />
              <Text style={styles.scheduleText}>Entrada: <Text style={styles.bold}>{todaySchedule.start_time} h</Text></Text>
            </View>
            <View style={styles.row}><Icon name="log-out-outline" size={20} color="#FF3B30" style={styles.icon} />
              <Text style={styles.scheduleText}>Salida: <Text style={styles.bold}>{todaySchedule.end_time} h</Text></Text>
            </View>
            <View style={styles.row}><Icon name="location-outline" size={20} color="#34C759" style={styles.icon} />
              <Text style={styles.scheduleText}>Instalación: <Text style={styles.bold}>{todaySchedule.facilityName}</Text></Text>
            </View>
            <View style={styles.row}><Icon name="map-outline" size={20} color="#8E8E93" style={styles.icon} />
              <Text style={styles.scheduleText}>Dirección: <Text style={styles.bold}>{todaySchedule.facilityLocation}</Text></Text>
            </View>
          </>
        ) : (
          <Text style={styles.noSchedule}>No tienes horario asignado para hoy.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.ficharButton, { backgroundColor: canFichar ? '#007AFF' : '#ccc' }]}
        onPress={handleFichar}
        disabled={!canFichar}
      >
        <Text style={styles.ficharText}>📍 Fichar ahora</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ficharButton, { backgroundColor: '#34C759', marginTop: 10 }]}
        onPress={handleCheckOut}
      >
        <Text style={styles.ficharText}>📤 Realizar Check-out</Text>
      </TouchableOpacity>


      {countdown && (
        <View style={styles.row}>
          <Icon name="hourglass-outline" size={20} color="#FF9500" style={styles.icon} />
          <Text style={[styles.scheduleText, { color: '#FF9500' }]}>
            Tiempo restante: <Text style={styles.bold}>{countdown}</Text>
          </Text>
        </View>
      )}

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{
            width: '85%',
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              ¿Deseas añadir una nota?
            </Text>

            <TextInput
              placeholder="Ej. Llegué tarde por tráfico..."
              value={note}
              onChangeText={setNote}
              style={{
                height: 100,
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 10,
                textAlignVertical: 'top',
                marginBottom: 20
              }}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ padding: 12, backgroundColor: '#ccc', borderRadius: 10, flex: 1, marginRight: 8 }}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 12, backgroundColor: '#007AFF', borderRadius: 10, flex: 1, marginLeft: 8 }}
                onPress={handleConfirmFichar}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Fichar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f6fb', padding: 20, justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 30, textAlign: 'center', color: '#1c1c1e' },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5, marginBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#007AFF' },
  scheduleText: { fontSize: 16, color: '#333', marginBottom: 6 },
  bold: { fontWeight: '600', color: '#000' },
  noSchedule: { fontSize: 15, color: '#888', fontStyle: 'italic' },
  ficharButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#007AFF', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  ficharText: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
});

export default Fichar;

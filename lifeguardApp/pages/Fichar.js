import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';


const Fichar = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [workSchedule, setWorkSchedule] = useState({});
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔧 Normaliza acentos y convierte a minúsculas
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

          const workSchedules = employeeData.work_schedule || [];

          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();

          const todayName = normalizeString(getDayName()); // ← ejemplo: "martes"

          // Encuentra el horario del mes actual
          const currentSchedule = workSchedules.find(ws => ws.month === currentMonth && ws.year === currentYear);

          console.log("Hoy es:", todayName);
          console.log("Horario mensual:", currentSchedule);

          if (currentSchedule) {
            const currentDate = getCurrentDate(); // ← "2025-04-07"
            const todaySchedule = currentSchedule.schedules.find(
              s => s.date === currentDate
            );

            console.log("Horario de hoy:", todaySchedule);
            setTodaySchedule(todaySchedule);
          } else {
            console.log("No hay horario mensual asignado para este mes.");
          }

          setWorkSchedule(workSchedules);
        } catch (error) {
          console.error("Error fetching employee data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleFichar = () => {
    console.log("Fichaje registrado");
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
            <View style={styles.row}>
              <Icon name="time-outline" size={20} color="#007AFF" style={styles.icon} />
              <Text style={styles.scheduleText}>
                Entrada: <Text style={styles.bold}>{todaySchedule.start_time} h</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="log-out-outline" size={20} color="#FF3B30" style={styles.icon} />
              <Text style={styles.scheduleText}>
                Salida: <Text style={styles.bold}>{todaySchedule.end_time} h</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="location-outline" size={20} color="#34C759" style={styles.icon} />
              <Text style={styles.scheduleText}>
                Instalación: <Text style={styles.bold}>{todaySchedule.facilityName}</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="map-outline" size={20} color="#8E8E93" style={styles.icon} />
              <Text style={styles.scheduleText}>
                Dirección: <Text style={styles.bold}>{todaySchedule.facilityLocation}</Text>
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.noSchedule}>No tienes horario asignado para hoy.</Text>
        )}
      </View>


      <TouchableOpacity style={styles.ficharButton} onPress={handleFichar}>
        <Text style={styles.ficharText}>📍 Fichar ahora</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fb',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1c1c1e',
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#007AFF',
  },
  scheduleText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
    color: '#000',
  },
  noSchedule: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  ficharButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ficharText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default Fichar;

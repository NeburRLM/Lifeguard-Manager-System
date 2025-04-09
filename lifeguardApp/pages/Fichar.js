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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // Opcional para obtener base64 si lo necesitas
import * as DocumentPicker from 'expo-document-picker';



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
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [absenceModalVisible, setAbsenceModalVisible] = useState(false);
  const [absenceNote, setAbsenceNote] = useState('');
  const [buttonsVisible, setButtonsVisible] = useState(true);
  const [canNotificarAusencia, setCanNotificarAusencia] = useState(false); // Control para notificar ausencia
  const [absenceNotified, setAbsenceNotified] = useState(false);
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);
  const [justificationImage, setJustificationImage] = useState(null);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentDateFormat = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${day}-${month}-${year}`;
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

    if (todaySchedule?.start_time && !hasCheckedIn && !absenceSubmitted) {
          const updateCountdown = () => {
            const now = new Date();
            const [hours, minutes] = todaySchedule.start_time.split(':').map(Number);
            const target = new Date();
            target.setHours(hours);
            target.setMinutes(minutes);
            target.setSeconds(0);

            const diff = now - target;

            if (diff < 0) {
              // Faltan X minutos para fichar
              const remaining = Math.abs(diff);
              const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
              const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
              const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);

              setCountdown({
                text: `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`,
                color: '#FF9500', // naranja
                label: 'Tiempo restante para fichar',
              });

              setCanFichar(remaining <= 10 * 60 * 1000); // Permite fichar cuando queden menos de 10 minutos
              setCanNotificarAusencia(remaining <= 10 * 60 * 1000); // Permite notificar ausencia cuando queden menos de 10 minutos
            } else {
              // Ya pasó la hora de fichar
              const lateHours = Math.floor(diff / (1000 * 60 * 60));
              const lateMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const lateSeconds = Math.floor((diff % (1000 * 60)) / 1000);

              setCountdown({
                text: `${String(lateHours).padStart(2, '0')}:${String(lateMinutes).padStart(2, '0')}:${String(lateSeconds).padStart(2, '0')}`,
                color: '#FF3B30', // rojo
                label: 'Llegas tarde',
              });

              setCanFichar(true); // Aún puede fichar aunque tarde
              setCanNotificarAusencia(true); // Permite notificar ausencia si ya pasó la hora de entrada
            }
          };

          updateCountdown();
          timer = setInterval(updateCountdown, 1000);
        }

        return () => clearInterval(timer);
      }, [todaySchedule, hasCheckedIn]);



useEffect(() => {
  const checkAttendanceFromBackend = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const response = await fetch(`http://192.168.1.34:4000/attendance/${userId}?year=${year}&month=${month}`);
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Buscar si hay un registro para el día actual
        const todayAttendance = result.data.find(att => att.date === day);

        if (todayAttendance) {
          // Si existe un registro, ya ha hecho check-in
          setHasCheckedIn(true);

          // Si check_out aún está en '00:00:00' => no ha hecho check-out
          if (todayAttendance.check_out && todayAttendance.check_out !== '00:00:00') {
            setHasCheckedOut(true);
          } else {
            setHasCheckedOut(false);
          }
        } else {
          // Si no hay registro para hoy, no ha hecho check-in ni check-out
          setHasCheckedIn(false);
          setHasCheckedOut(false);
        }
      } else {
        console.warn('No se pudo obtener la asistencia:', result.message);
        setHasCheckedIn(false);
        setHasCheckedOut(false);
      }
    } catch (error) {
      console.error('Error al verificar la asistencia desde el backend:', error);
      setHasCheckedIn(false);
      setHasCheckedOut(false);
    }
  };

  checkAttendanceFromBackend();
}, []);




// Se guarda de manera local
/*
  useEffect(() => {
    const loadCheckStatus = async () => {
      const today = getCurrentDate();
      const storedCheckInDate = await AsyncStorage.getItem('checkInDate');
      const storedCheckOutDate = await AsyncStorage.getItem('checkOutDate');

      if (storedCheckInDate === today) setHasCheckedIn(true);
      if (storedCheckOutDate === today) setHasCheckedOut(true);
    };

    loadCheckStatus();
  }, []);
*/

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
        await AsyncStorage.setItem('checkInDate', getCurrentDate());
        setHasCheckedIn(true);
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
         await AsyncStorage.setItem('checkOutDate', getCurrentDate());
         setHasCheckedOut(true);
         Alert.alert('Hasta mañana 👋', 'Nos vemos en tu próximo turno.');

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

  const handleSubmitAbsence = async () => {
    try {
      if (!absenceNote.trim()) {
        Alert.alert('Nota requerida', 'Por favor, escribe una razón para tu ausencia.');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const facilityId = todaySchedule?.facilityId || await AsyncStorage.getItem('facilityId');
      const currentDate = getCurrentDate(); // 'YYYY-MM-DD'

      console.log("🟡 Enviando ausencia con:", {
        userId,
        facilityId,
        currentDate,
        absenceNote,
        justificationImage,
      });

      const response = await fetch('http://192.168.1.34:4000/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: userId,
          facilityId: facilityId,
          date: currentDate,
          status: 'absent',
          absence_reason: absenceNote,
          justified: true,
          justification_url: justificationImage?.uri || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Ausencia registrada', 'Tu ausencia ha sido notificada correctamente.');
        setAbsenceModalVisible(false);
        setButtonsVisible(false);
        setHasCheckedIn(false);
        setHasCheckedOut(false);
        setAbsenceSubmitted(true);

        const now = new Date();
        const nextDay = new Date();
        nextDay.setDate(now.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);

        const timeUntilMidnight = nextDay - now;

        setTimeout(() => {
          setButtonsVisible(true);
          setHasCheckedIn(false);
          setHasCheckedOut(false);
        }, timeUntilMidnight);
      } else {
        const errorText = await response.text();
        console.error('❌ Error al registrar ausencia:', errorText);
        Alert.alert('Error', 'No se pudo registrar la ausencia.');
      }
    } catch (error) {
      console.error('❌ Error al notificar ausencia:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar tu ausencia.');
    }
  };



const pickImage = async () => {
  const imageResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: true,
    quality: 0.5,
  });

  if (!imageResult.canceled) {
    const asset = imageResult.assets[0];
    console.log("📎 Imagen seleccionada:", asset);
    setJustificationImage({
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      fileName: asset.fileName || `imagen-${Date.now()}.jpg`,
    });
  }
};


  const pickDocument = async () => {
    const docResult = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });

    if (docResult.type === 'success') {
      setJustificationImage({
        uri: docResult.uri,
        type: docResult.mimeType || 'application/pdf',
        fileName: docResult.name || `documento-${Date.now()}.pdf`,
      });
    }
  };







return (
  <View style={styles.container}>
    <Text style={styles.header}>Bienvenido, {employeeName}</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>📅 Horario para hoy ({getCurrentDateFormat()})</Text>
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

   {/* Caso 1: Mostrar botones de "Fichar ahora" y "Notificar ausencia" */}
   {!hasCheckedIn && buttonsVisible && !absenceSubmitted && (
     <>
       <TouchableOpacity
         style={[styles.ficharButton, { backgroundColor: canFichar ? '#007AFF' : '#ccc' }]}
         onPress={handleFichar}
         disabled={!canFichar}
       >
         <Text style={styles.ficharText}>📍 Fichar ahora</Text>
       </TouchableOpacity>

       {canNotificarAusencia && (
         <TouchableOpacity
           style={[styles.ficharButton, { backgroundColor: '#FF9500', marginTop: 10 }]}
           onPress={() => setAbsenceModalVisible(true)}
         >
           <Text style={styles.ficharText}>🚫 Notificar ausencia</Text>
         </TouchableOpacity>
       )}
     </>
   )}

   {/* Caso 2: Mostrar botón de Check-out */}
   {hasCheckedIn && !hasCheckedOut && !absenceSubmitted && (
     <>
       <TouchableOpacity
         style={[styles.ficharButton, { backgroundColor: '#34C759', marginTop: 10 }]}
         onPress={handleCheckOut}
       >
         <Text style={styles.ficharText}>📤 Realizar Check-out</Text>
       </TouchableOpacity>
       <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
         ✅ Realiza tu Check-out
       </Text>
     </>
   )}

   {/* Caso 3: Mostrar mensaje de jornada completada */}
   {hasCheckedIn && hasCheckedOut && !absenceSubmitted && (
     <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
       ✅ Has completado tu jornada. ¡Hasta mañana!
     </Text>
   )}

{/* Caso 4: Mostrar mensaje de ausencia registrada */}
{absenceSubmitted && (
  <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
    ✅ Tu ausencia ha sido registrada.
  </Text>
)}


      {countdown && !hasCheckedIn && !absenceSubmitted && (
        <View style={styles.row}>
          <Icon name="hourglass-outline" size={20} color={countdown.color} style={styles.icon} />
          <Text style={[styles.scheduleText, { color: countdown.color }]}>
            {countdown.label}: <Text style={styles.bold}>{countdown.text}</Text>
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

      <Modal
            animationType="slide"
            transparent={true}
            visible={absenceModalVisible}
            onRequestClose={() => setAbsenceModalVisible(false)}
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
                  Justifica tu ausencia
                </Text>

                <TextInput
                  placeholder="Ej. Enfermedad, transporte, etc..."
                  value={absenceNote}
                  onChangeText={setAbsenceNote}
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

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Seleccionar justificante',
                      '¿Qué tipo de archivo quieres adjuntar?',
                      [
                        { text: '📷 Foto', onPress: pickImage },
                        { text: '📄 Documento PDF', onPress: pickDocument },
                        { text: 'Cancelar', style: 'cancel' },
                      ]
                    );
                  }}
                  style={{ backgroundColor: '#eee', padding: 12, borderRadius: 10, marginBottom: 10 }}
                >
                  <Text style={{ textAlign: 'center' }}>📎 Adjuntar justificante</Text>
                </TouchableOpacity>


                {justificationImage && (
                  justificationImage.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: justificationImage.uri }}
                      style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 10 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ marginBottom: 10, textAlign: 'center' }}>
                      📄 Archivo adjunto: {justificationImage.fileName}
                    </Text>
                  )
                )}



                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: '#ccc', borderRadius: 10, flex: 1, marginRight: 8 }}
                    onPress={() => setAbsenceModalVisible(false)}
                  >
                    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: '#FF3B30', borderRadius: 10, flex: 1, marginLeft: 8 }}
                    onPress={handleSubmitAbsence}
                  >
                    <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Enviar</Text>
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

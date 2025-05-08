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
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // Opcional para obtener base64 si lo necesitas
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import moment from 'moment-timezone';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


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
  const API_URL = Constants.expoConfig.extra.API_URL;
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
  const [modalVisibleCheckout, setModalVisibleCheckout] = useState(false);
  const [checkOutNote, setCheckOutNote] = useState('');
  const { t, i18n } = useTranslation();

  const getCurrentDate = () => moment().tz('Europe/Madrid').format('YYYY-MM-DD');

  const getCurrentDateFormat = () => moment().tz('Europe/Madrid').format('DD-MM-YYYY');

  const normalizeString = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const getDayName = () => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const dayIndex = moment().tz('Europe/Madrid').day();
    return days[dayIndex];
  };



  useEffect(() => {
    const restoreCheckStatusForNextDay = async () => {
       const today = getCurrentDate(); // Obtener la fecha de hoy (YYYY-MM-DD)
      const notificationSentKey = `notificationSent-${today}`;
      const statusMarkedKey = `missingCheckOutMarked-${today}`;

      const storedCheckInDate = await AsyncStorage.getItem('checkInDate');
      const storedCheckOutDate = await AsyncStorage.getItem('checkOutDate');
      const alreadyNotified = await AsyncStorage.getItem(notificationSentKey);
      const alreadyMarked = await AsyncStorage.getItem(statusMarkedKey);
 // Verifica si ya se marcó el estado

      // Restablecer el estado de check-in y check-out solo si el día de hoy es diferente
      if (storedCheckInDate !== today) {
        setHasCheckedIn(false);
      }
      if (storedCheckOutDate !== today) {
        setHasCheckedOut(false);
      }
      // Restablecer el estado de notificación solo si el día de hoy es diferente
          if (alreadyNotified !== today) {
            console.log("Restableciendo notificación a false");
            await AsyncStorage.setItem(notificationSentKey, 'false'); // Guardar como cadena "false"
          }

          // Restablecer el estado de marcado solo si el día de hoy es diferente
          if (alreadyMarked !== today) {
            console.log("Restableciendo marcado a false");
            await AsyncStorage.setItem(statusMarkedKey, 'false'); // Guardar como cadena "false"
          }
    };

    restoreCheckStatusForNextDay();
  }, []);


  useEffect(() => {
    const checkAttendanceFromBackend = async () => {
      try {
       const userId = await AsyncStorage.getItem('userId');
       const today = getCurrentDate();
       const year = moment(today).year();
       const month = moment(today).month() + 1;

        const response = await fetch(`${API_URL}/attendance/${userId}?year=${year}&month=${month}`);
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          // Buscar si hay un registro para el día actual
          const todayAttendance = result.data.find(att => att.date === today);

              if (todayAttendance) {
                      setHasCheckedIn(true);
                      setHasCheckedOut(todayAttendance.check_out && todayAttendance.check_out !== '0:00:00');
                    } else {
                      setHasCheckedIn(false);
                      setHasCheckedOut(false);
                    }
                  } else {
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

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/employee/${userId}`);
          const employeeData = await response.json();
          setEmployeeName(employeeData.name);

          const today = getCurrentDate();
                    const currentMonth = moment(today).month() + 1;
                    const currentYear = moment(today).year();
                    const todayName = normalizeString(getDayName());

          const currentSchedule = employeeData.work_schedule?.find(
                      ws => ws.month === currentMonth && ws.year === currentYear
                    );

          if (currentSchedule) {
                      const todayData = currentSchedule.schedules.find(
                        s => s.date === today
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
            const now = moment().tz('Europe/Madrid');
            const [hours, minutes] = todaySchedule.start_time.split(':').map(Number); // Parse start_time
              const target = moment().tz('Europe/Madrid').set({
                hour: hours,
                minute: minutes,
                second: 0,
                millisecond: 0,
              }); // Set target time based on start_time

            const diff = now.diff(target);

            if (diff < 0) {
              // Faltan X minutos para fichar
              const remaining = moment.duration(-diff);


               setCountdown({
                          text: `${String(remaining.hours()).padStart(2, '0')}:${String(remaining.minutes()).padStart(2, '0')}:${String(remaining.seconds()).padStart(2, '0')}`,
                          color: '#FF9500',
                          label: t('fichar.remainingTime'),
                        });

               setCanFichar(remaining.asMinutes() <= 10);
                        setCanNotificarAusencia(remaining.asMinutes() <= 10);
            } else {
              // Ya pasó la hora de fichar
              const late = moment.duration(diff);
                        setCountdown({
                          text: `${String(late.hours()).padStart(2, '0')}:${String(late.minutes()).padStart(2, '0')}:${String(late.seconds()).padStart(2, '0')}`,
                          color: '#FF3B30',
                          label: t('fichar.late'),
                        });
                        setCanFichar(true);
                        setCanNotificarAusencia(true);
            }
          };

          updateCountdown();
          timer = setInterval(updateCountdown, 1000);
        }

        return () => clearInterval(timer);
      }, [todaySchedule, hasCheckedIn]);






useEffect(() => {
  const checkIfMissedCheckIn = async () => {
    if (todaySchedule) {
      const now = moment().tz('Europe/Madrid'); // Obtener la hora actual en la zona horaria de Madrid
      const todayDate = now.format('YYYY-MM-DD'); // Formatear la fecha actual (YYYY-MM-DD)

      // Parsear las horas de inicio y fin desde el horario
      const startTime = moment.tz(todaySchedule.start_time, 'HH:mm', 'Europe/Madrid');
      const endTime = todaySchedule.end_time
        ? moment.tz(todaySchedule.end_time, 'HH:mm', 'Europe/Madrid')
        : startTime;

      const alreadyMarked = await AsyncStorage.getItem(`missingMarked-${todayDate}`);

      // Verificar si ya pasó el tiempo de check-in y aún no se ha marcado asistencia
      if (now.isAfter(endTime) && !hasCheckedIn && !alreadyMarked) {
        setButtonsVisible(false);

        try {
          const userId = await AsyncStorage.getItem('userId');
          const attendanceData = {
            employeeId: userId,
            date: todayDate,
            facilityId: todaySchedule.facilityId,
            justified: false,
            status: 'missing',
          };

          const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData),
          });

          if (response.ok) {
            await AsyncStorage.setItem(`missingMarked-${todayDate}`, 'true'); // Evitar duplicado
            Alert.alert(t('fichar.absenceSuccess'), t('fichar.no-check-in'));
          } else {
            const errorText = await response.text();
            //console.error('Error al registrar asistencia:', errorText);
          }
        } catch (error) {
          console.error('Error al verificar la asistencia:', error);
        }
      }
    }
  };

  checkIfMissedCheckIn();
}, [todaySchedule]);



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
      Alert.alert(t('fichar.missingSchedule'), t('fichar.missingScheduleMessage'));
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('fichar.ubi-denied'), t('fichar.ubi-denied2'));
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };
      console.log("UBIIIIIIIIII-> ", location.latitude, location.longitude);

      const facilityCoords = {
        latitude: todaySchedule.facility.latitude,
        longitude: todaySchedule.facility.longitude,
      };

      const distance = haversineDistance(location, facilityCoords);

      if (distance > 50) {
        Alert.alert(t('fichar.locationError'), t('fichar.locationErrorMessage'));
        return;
      }

      const userId = await AsyncStorage.getItem('userId');

      const now = moment().tz('Europe/Madrid'); // Hora actual en Madrid
      const scheduledCheckIn = moment.tz(todaySchedule.start_time, 'HH:mm', 'Europe/Madrid'); // Hora programada de entrada

      // Definir el rango permitido
      const tenMinBefore = scheduledCheckIn.clone().subtract(10, 'minutes'); // 10 minutos antes de la hora de entrada
      const fiveMinAfter = scheduledCheckIn.clone().add(5, 'minutes'); // 5 minutos después de la hora de entrada

      // Aplicar la lógica de suplantación si está dentro del rango
      const finalCheckIn = now.isBetween(tenMinBefore, fiveMinAfter) ? scheduledCheckIn : now;

      // Formatear la hora a 'HH:MM:SS'
      const formatTimeOnly = (momentObj) => momentObj.format('HH:mm:ss');

      const attendanceData = {
        employeeId: userId,
        check_in: formatTimeOnly(finalCheckIn), // Hora del fichaje
        date: finalCheckIn.format('YYYY-MM-DD'), // Fecha del fichaje
        facilityId: todaySchedule.facilityId,
        note_in: note,
      };

      console.log('Datos que se enviarán al servidor:', JSON.stringify(attendanceData, null, 2));

      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        Alert.alert(t('fichar.checkInSuccess'), t('fichar.checkInSuccessMessage'));
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
      Alert.alert(t('fichar.missingSchedule'), t('fichar.no-ubi-found'));
    }
  };

const handleConfirmCheckOut = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('fichar.no-ubi-found'), t('fichar.no-ubi-found2'));
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const userId = await AsyncStorage.getItem('userId');
    const now = moment().tz('Europe/Madrid'); // Obtener la hora actual en Madrid

    const response = await fetch(`${API_URL}/attendance/checkout`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: userId,
        date: now.format('YYYY-MM-DD'), // Fecha actual en formato YYYY-MM-DD
        check_out: now.format('HH:mm:ss'), // Hora actual en formato HH:MM:SS
        note_out: checkOutNote, // Nueva propiedad con la nota
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      }),
    });

    if (response.ok) {
      Alert.alert(t('fichar.checkOutSuccess'), t('fichar.checkOutSuccessMessage'));
      await AsyncStorage.setItem('checkOutDate', now.format('YYYY-MM-DD')); // Guardar la fecha actual
      setHasCheckedOut(true);
      setModalVisibleCheckout(false);
      setCheckOutNote('');
      Alert.alert(`${t('fichar.see-tomorrow1')} 👋`, t('fichar.see-tomorrow2'));
    } else {
      const errorText = await response.text();
      console.error('Respuesta del servidor:', errorText);
      Alert.alert(t('fichar.missingSchedule'), t('fichar.checkout-error'));
    }
  } catch (error) {
    console.error('Error en check-out:', error);
    Alert.alert(t('fichar.missingSchedule'), t('fichar.checkout-error2'));
  }
};


const handleSubmitAbsence = async () => {
  try {
    if (!absenceNote.trim()) {
      Alert.alert(t('fichar.absenceReason'), t('fichar.absenceReasonMessage'));
      return;
    }

    const userId = await AsyncStorage.getItem('userId');
    const facilityId = todaySchedule?.facilityId || await AsyncStorage.getItem('facilityId');
    const currentDate = moment().tz('Europe/Madrid').format('YYYY-MM-DD'); // Fecha actual en formato YYYY-MM-DD

    const formData = new FormData();
    formData.append('employeeId', userId);
    formData.append('facilityId', facilityId);
    formData.append('date', currentDate);
    formData.append('status', 'absent');
    formData.append('absence_reason', absenceNote);
    formData.append('justified', 'true');

    if (justificationImage) {
      formData.append('justification', {
        uri: justificationImage.uri,
        type: justificationImage.type,
        name: justificationImage.fileName || `archivo-${moment().format('YYYYMMDDHHmmss')}.${justificationImage.type.split('/')[1]}`, // Nombre único basado en la fecha/hora actual
      });
    }

    const response = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      Alert.alert(t('fichar.absenceSuccess'), t('fichar.absenceSuccessMessage'));
      setAbsenceModalVisible(false);
      setButtonsVisible(false);
      setHasCheckedIn(false);
      setHasCheckedOut(false);
      setAbsenceSubmitted(true);

      const now = moment().tz('Europe/Madrid'); // Hora actual
      const nextDay = now.clone().add(1, 'day').startOf('day'); // Inicio del siguiente día a medianoche
      const timeUntilMidnight = nextDay.diff(now); // Tiempo restante hasta la medianoche

      setTimeout(() => {
        setButtonsVisible(true);
        setHasCheckedIn(false);
        setHasCheckedOut(false);
      }, timeUntilMidnight);
    } else {
      const errorText = await response.text();
      console.error('❌ Error al registrar ausencia:', errorText);
      Alert.alert(t('fichar.missingSchedule'), t('fichar.abs-error1'));
    }
  } catch (error) {
    console.error('❌ Error al notificar ausencia:', error);
    Alert.alert(t('fichar.missingSchedule'), t('fichar.abs-error2'));
  }
};

const scheduleMissingCheckoutNotification = async (schedule) => {
  try {
    const now = moment().tz('Europe/Madrid');
    const scheduledEndTime = moment.tz(schedule.end_time, 'HH:mm', 'Europe/Madrid').set({
      year: now.year(),
      month: now.month(),
      date: now.date(),
    });

    if (!scheduledEndTime.isValid()) {
      console.error("❌ Formato de endTime inválido:", schedule.end_time);
      return;
    }

    const notifTime = scheduledEndTime.clone().add(3, 'minutes').add(10, 'seconds');

    console.log("🔔 Notificación programada para:", notifTime.toISOString());

    const todayDate = now.format('YYYY-MM-DD');
    const notificationSentKey = `notificationSent-${todayDate}-${schedule.id || 'default'}`;

    const alreadyNotified = await AsyncStorage.getItem(notificationSentKey);
    //await AsyncStorage.removeItem(notificationSentKey);
    console.log("🕒 Hora actual:", now.format());
    console.log("⏳ Hora de fin programada:", scheduledEndTime.format());
    console.log("🔔 Notificación será a:", notifTime.format());

    /*if (notifTime.isBefore(now)) {
      console.error("❌ La hora de notificación ya ha pasado.");
      return;
    }*/

    //console.log("🧪 trigger.date (timestamp):", notifTime.toDate().getTime());
    //console.log("🧪 trigger.date (locale string):", notifTime.toDate().toLocaleString());
    //console.log("🧪 trigger.date (ISO string):", notifTime.toDate().toISOString());

    //await Notifications.cancelAllScheduledNotificationsAsync();

    if (!alreadyNotified || alreadyNotified === 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('fichar.notificationTitle'),
          body: t('fichar.notificationBody'),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date: notifTime.toDate() },
      });

      await AsyncStorage.setItem(notificationSentKey, 'true');
      console.log("✅ Notificación programada correctamente.");
    } else {
      console.log("ℹ️ Ya se ha programado una notificación hoy.");
    }
  } catch (error) {
    console.error("❌ Error al programar la notificación:", error);
  }
};




useEffect(() => {
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('fichar.ubi-denied'), t('fichar.noti-denied'));
    }
  };

  requestNotificationPermissions();
}, []);

useEffect(() => {
  const handleMissedCheckout = async () => {
    console.log("💡 Revisando check-out automático...", { hasCheckedIn, hasCheckedOut, todaySchedule, absenceSubmitted });

    if (!todaySchedule || hasCheckedOut || !hasCheckedIn || absenceSubmitted) return;

    const now = moment().tz('Europe/Madrid'); // Hora actual en Madrid
   const scheduledEndTime = moment.tz(todaySchedule.end_time, 'HH:mm', 'Europe/Madrid').set({
         year: now.year(),
         month: now.month(),
         date: now.date(),
       });

    const notifTime = scheduledEndTime.clone().add(3, 'minutes').add(10, 'seconds');

    if (now.isAfter(notifTime)) {
        console.log("🧪 trigger.date (locale string):", notifTime.toDate().toLocaleString());
        console.log("🧪 now (locale string):", now.toDate().toLocaleString());
        await scheduleMissingCheckoutNotification(todaySchedule);
    }

    const fifteenMinutesAfter = scheduledEndTime.clone().add(5, 'minutes'); // 15 minutos después del fin del turno
    const todayDate = now.format('YYYY-MM-DD');
    const statusMarkedKey = `missingCheckOutMarked-${todayDate}`;
    const alreadyMarked = await AsyncStorage.getItem(statusMarkedKey);

    console.log("🧪 Hora actual:", now.format());
    console.log("🧪 Hora objetivo para PUT:", fifteenMinutesAfter.format());
    console.log("🧪 alreadyMarked:", alreadyMarked, typeof alreadyMarked);

    // Registrar automáticamente el check-out perdido
    if (now.isAfter(fifteenMinutesAfter) && (!alreadyMarked || alreadyMarked === 'false')) {
      console.log("ENTRAAAAAAA")
      try {
        const userId = await AsyncStorage.getItem('userId');

        const missingCheckoutData = {
          employeeId: userId,
          date: todayDate,
          facilityId: todaySchedule.facilityId,
          check_out: scheduledEndTime.format('HH:mm:ss'), // Hora de fin en formato HH:mm:ss
          status: 'missing_check_out',
          justified: false,
        };

        const response = await fetch(`${API_URL}/attendance/checkout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(missingCheckoutData),
        });

        if (response.ok) {
          console.log('✅ Check-out perdido registrado automáticamente.');
          await AsyncStorage.setItem(statusMarkedKey, 'true');
          setHasCheckedOut(true);
        } else {
          const errorText = await response.text();
          console.error('❌ Error al registrar el check-out perdido:', errorText);
        }
      } catch (error) {
        console.error('❌ Error en lógica de check-out perdido:', error);
      }
    }
  };

  const interval = setInterval(() => {
    handleMissedCheckout();
  }, 60000); // Revisión cada 1 minuto

  return () => clearInterval(interval);
}, [todaySchedule, hasCheckedIn, hasCheckedOut, absenceSubmitted]);






const pickDocument = async () => {
  try {
    const docResult = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!docResult.canceled) {
      const file = docResult.assets[0]; // Acceder correctamente al archivo
      //console.log("📄 Documento seleccionado:", file);

      setJustificationImage({
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        fileName: file.name || `documento-${Date.now()}.pdf`,
      });
    } else {
      console.log("Se canceló la selección del documento.");
    }
  } catch (error) {
    console.error("Error al seleccionar el documento:", error);
  }
};












return (
  <View style={styles.container}>
    <Text style={styles.header}>{t('fichar.welcome', { name: employeeName })}</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('fichar.scheduleForToday', { date: getCurrentDateFormat() })}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : todaySchedule ? (
        <>
          <View style={styles.row}><Icon name="time-outline" size={20} color="#007AFF" style={styles.icon} />
            <Text style={styles.scheduleText}>{t('fichar.entry')}: <Text style={styles.bold}>{todaySchedule.start_time} h</Text></Text>
          </View>
          <View style={styles.row}><Icon name="log-out-outline" size={20} color="#FF3B30" style={styles.icon} />
            <Text style={styles.scheduleText}>{t('fichar.exit')}: <Text style={styles.bold}>{todaySchedule.end_time} h</Text></Text>
          </View>
          <View style={styles.row}><Icon name="location-outline" size={20} color="#34C759" style={styles.icon} />
            <Text style={styles.scheduleText}>{t('fichar.facility')}: <Text style={styles.bold}>{todaySchedule.facilityName}</Text></Text>
          </View>
          <View style={styles.row}><Icon name="map-outline" size={20} color="#8E8E93" style={styles.icon} />
            <Text style={styles.scheduleText}>{t('fichar.address')}: <Text style={styles.bold}>{todaySchedule.facilityLocation}</Text></Text>
          </View>
        </>
      ) : (
        <Text style={styles.noSchedule}>{t('fichar.noSchedule')}</Text>
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
         <Text style={styles.ficharText}>{t('fichar.clockInNow')}</Text>
       </TouchableOpacity>

       {canNotificarAusencia && (
         <TouchableOpacity
           style={[styles.ficharButton, { backgroundColor: '#FF9500', marginTop: 10 }]}
           onPress={() => setAbsenceModalVisible(true)}
         >
           <Text style={styles.ficharText}>{t('fichar.notifyAbsence')}</Text>
         </TouchableOpacity>
       )}
     </>
   )}

   {/* Caso 2: Mostrar botón de Check-out */}
   {hasCheckedIn && !hasCheckedOut && !absenceSubmitted && (
     <>
       <TouchableOpacity
         style={[styles.ficharButton, { backgroundColor: '#34C759', marginTop: 10 }]}
         onPress={() => setModalVisibleCheckout(true)}
       >
         <Text style={styles.ficharText}>{t('fichar.checkOut')}</Text>
       </TouchableOpacity>
       <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
         {t('fichar.do-checkOut')}
       </Text>
     </>
   )}

   {/* Caso 3: Mostrar mensaje de jornada completada */}
   {hasCheckedIn && hasCheckedOut && !absenceSubmitted && (
     <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
       {t('fichar.completeDay')}
     </Text>
   )}

{/* Caso 4: Mostrar mensaje de ausencia registrada */}
{absenceSubmitted && (
  <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }}>
    {t('fichar.absenceRegistered')}
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
              {t('fichar.addNote')}
            </Text>

            <TextInput
              placeholder={t('fichar.exampleNote')}
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
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{t('fichar.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 12, backgroundColor: '#007AFF', borderRadius: 10, flex: 1, marginLeft: 8 }}
                onPress={handleConfirmFichar}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{t('fichar.do-entry')}</Text>
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
                  {t('fichar.justifyAbsence')}
                </Text>

                <TextInput
                  placeholder={t('fichar.exampleAbsenceNote')}
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
                      t('fichar.justify-select'),
                      t('fichar.doc-pdf'),
                      [
                        { text: `📄 ${t('fichar.doc-pdf2')}`, onPress: pickDocument },
                        { text: t('fichar.cancel'), style: 'cancel' },
                      ]
                    );
                  }}
                  style={{ backgroundColor: '#eee', padding: 12, borderRadius: 10, marginBottom: 10 }}
                >
                  <Text style={{ textAlign: 'center' }}>{t('fichar.attachJustification')}</Text>
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
                      📄 {t('fichar.attached-file')}: {justificationImage.fileName}
                    </Text>
                  )
                )}



                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: '#ccc', borderRadius: 10, flex: 1, marginRight: 8 }}
                    onPress={() => setAbsenceModalVisible(false)}
                  >
                    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{t('fichar.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: '#FF3B30', borderRadius: 10, flex: 1, marginLeft: 8 }}
                    onPress={handleSubmitAbsence}
                  >
                    <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{t('fichar.send')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisibleCheckout}
              onRequestClose={() => setModalVisibleCheckout(false)}
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
                    {t('fichar.addExitNote')}
                  </Text>

                  <TextInput
                    placeholder={t('fichar.exampleExitNote')}
                    value={checkOutNote}
                    onChangeText={setCheckOutNote}
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
                      onPress={() => setModalVisibleCheckout(false)}
                    >
                      <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{t('fichar.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ padding: 12, backgroundColor: '#34C759', borderRadius: 10, flex: 1, marginLeft: 8 }}
                      onPress={handleConfirmCheckOut}
                    >
                      <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{t('fichar.confirm')}</Text>
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
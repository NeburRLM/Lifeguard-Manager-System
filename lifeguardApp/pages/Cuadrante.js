import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styled from 'styled-components/native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

LocaleConfig.locales['es'] = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
};
LocaleConfig.defaultLocale = 'es';


const Cuadrante = () => {
  const API_URL = Constants.expoConfig.extra.API_URL;
  const [employeeName, setEmployeeName] = useState('');
  const [workSchedule, setWorkSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [formattedSchedule, setFormattedSchedule] = useState({});
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language === 'es') {
      LocaleConfig.locales['es'] = {
        monthNames: [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ],
        monthNamesShort: [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun",
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
        ],
        dayNames: [
          "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
        ],
        dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      };
      LocaleConfig.defaultLocale = 'es';
    }

    if (i18n.language === 'ca') {
      LocaleConfig.locales['ca'] = {
        monthNames: [
          "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
          "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
        ],
        monthNamesShort: [
          "Gen", "Feb", "Mar", "Abr", "Mai", "Jun",
          "Jul", "Ago", "Set", "Oct", "Nov", "Des"
        ],
        dayNames: [
          "Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"
        ],
        dayNamesShort: ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"]
      };
      LocaleConfig.defaultLocale = 'ca';
    }

    if (i18n.language === 'en') {
        LocaleConfig.locales['en'] = {
          monthNames: [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
          ],
          monthNamesShort: [
            'Jan','Feb','Mar','Apr','May','Jun',
            'Jul','Aug','Sep','Oct','Nov','Dec'
          ],
          dayNames: [
            'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
          ],
          dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        };
        LocaleConfig.defaultLocale = 'en';
      }
  }, [i18n.language]);


  // Obtener la fecha actual en formato 'YYYY-MM-DD'
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formatear la fecha seleccionada para mostrarla en formato 'día, mes, año'
  const formatSelectedDate = (date) => {
      const [year, month, day] = date.split('-');
      const currentDate = new Date(year, month - 1, day); // Mes es 0-indexed en JS
      return currentDate.toLocaleDateString(i18n.language, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

  // Obtener la información del empleado desde AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/employee/${userId}`);
          const employeeData = await response.json();
          setEmployeeName(employeeData.name);
          setWorkSchedule(employeeData.work_schedule);
        } catch (error) {
          console.error("Error fetching employee data:", error);
        }
      }
    };

    fetchUserData();

    // Establecer la fecha actual como el día seleccionado por defecto
    const currentDate = getCurrentDate();
    setSelectedDate(currentDate);
  }, []);

  // Formatear el schedule para que se pueda usar con el calendario
  useEffect(() => {
    const formatSchedule = () => {
      const formatted = {};
      workSchedule.forEach((scheduleItem) => {
        scheduleItem.schedules.forEach((schedule) => {
          const date = schedule.date;
          if (!formatted[date]) {
            formatted[date] = [];
          }
          formatted[date].push({
            start: schedule.start_time,
            end: schedule.end_time,
            facility: schedule.facility.name,
          });
        });
      });
      setFormattedSchedule(formatted);
    };

    formatSchedule();
  }, [workSchedule]);

  // Manejar la selección de un día
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  // Obtener las tareas del día seleccionado
  const getScheduleForSelectedDay = () => {
    if (formattedSchedule[selectedDate]) {
      return formattedSchedule[selectedDate].map((schedule, index) => (
        <ScheduleItem key={index}>
          <ScheduleText>{t('cuadrante.startTime')}: {schedule.start} h</ScheduleText>
          <ScheduleText>{t('cuadrante.endTime')}: {schedule.end} h</ScheduleText>
          <ScheduleText>{t('cuadrante.facility')}: {schedule.facility}</ScheduleText>
        </ScheduleItem>
      ));
    } else {
      return <NoScheduleText>{t('cuadrante.freeDay')}</NoScheduleText>;
    }
  };

  return (
    <Container>
      <Header>
        <Greeting>{t('cuadrante.workCalendar')}</Greeting>
        <EmployeeName>{employeeName}</EmployeeName>
      </Header>

      <Calendar
        key={i18n.language}
        onDayPress={handleDayPress}
        monthFormat={'MMMM yyyy'}
        markedDates={Object.keys(formattedSchedule).reduce((acc, date) => {
          acc[date] = { marked: true, selectedColor: '#4B89DC', selectedTextColor: 'white' };
          return acc;
        }, {})}
        style={calendarStyle}
        current={selectedDate}
        selectedDayColor={'#4B89DC'}
        selectedDayTextColor={'white'}
        firstDay={1} // Inicia la semana el lunes
      />

      <ScheduleContainer>
        <Text>{t('cuadrante.detailsForDay')}: {formatSelectedDate(selectedDate)}</Text>
        {getScheduleForSelectedDay()}
      </ScheduleContainer>
    </Container>
  );
};

// Estilos con styled-components
const Container = styled.View`
  flex: 1;
  background-color: #f0f4f8;
  padding: 20px;
`;

const Header = styled.View`
  margin-bottom: 20px;
  align-items: center;
  padding-bottom: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #dcdcdc;
`;

const Greeting = styled.Text`
  font-size: 26px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
`;

const EmployeeName = styled.Text`
  font-size: 18px;
  font-weight: 500;
  color: #555;
`;

const ScheduleContainer = styled.View`
  margin-top: 20px;
`;

const ScheduleItem = styled.View`
  background-color: #e0f7fa;
  padding: 15px;
  border-radius: 10px;
  margin-top: 10px;
  margin-bottom: 15px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 5px;
  elevation: 3;
`;

const ScheduleText = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
`;

const NoScheduleText = styled.Text`
  font-size: 16px;
  color: #ff6347;
  font-weight: bold;
  text-align: left;
`;

const calendarStyle = {
  borderWidth: 1,
  borderColor: '#dcdcdc',
  height: 350,
  borderRadius: 10,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 3,
};

export default Cuadrante;

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styled from 'styled-components/native';

const Cuadrante = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [workSchedule, setWorkSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [formattedSchedule, setFormattedSchedule] = useState({});

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
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const currentDate = new Date(year, month - 1, day); // Mes es 0-indexed en JS
    const dayOfWeek = daysOfWeek[currentDate.getDay()];

    return `${day} de ${months[month - 1]} de ${year}`;
  };

  // Obtener la información del empleado desde AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
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
          <ScheduleText>Inicio: {schedule.start} h</ScheduleText>
          <ScheduleText>Fin: {schedule.end} h</ScheduleText>
          <ScheduleText>Facility: {schedule.facility}</ScheduleText>
        </ScheduleItem>
      ));
    } else {
      return <NoScheduleText>¡Hoy es día libre!</NoScheduleText>;
    }
  };

  return (
    <Container>
      <Header>
        <Greeting>Calendario de trabajo</Greeting>
        <EmployeeName>{employeeName}</EmployeeName>
      </Header>

      <Calendar
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
        <Text>Detalles del horario para el día: {formatSelectedDate(selectedDate)}</Text>
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

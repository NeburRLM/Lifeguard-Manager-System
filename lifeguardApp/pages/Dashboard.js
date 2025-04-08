import React, { useEffect, useState } from "react";
import { ImageBackground, Text, View, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurrentForecast from "../components/CurrentForecast";
import styled from "styled-components/native";
import bgImg from "../assets/4.png";
import { useNavigation } from "@react-navigation/native"; // 👈 para navegar

const Dashboard = () => {
  const [weather, setWeather] = useState({});
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [hasScheduleToday, setHasScheduleToday] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  const navigation = useNavigation(); // 👈 hook para navegación

  useEffect(() => {
    const fetchUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          const res = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
          const employee = await res.json();
          setEmployeeName(employee.name);

          const today = new Date().toISOString().split("T")[0];
          const allSchedules = employee.work_schedule.flatMap(ws => ws.schedules);
          const todaySchedule = allSchedules.find(sch => sch.date === today);
          const todayD = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = todayD.toLocaleDateString('es-ES', options);
            setCurrentDate(formattedDate);
          if (todaySchedule && todaySchedule.facility) {
            setLat(todaySchedule.facility.latitude);
            setLong(todaySchedule.facility.longitude);
            setLocationName(todaySchedule.facility.name);
          } else {
            setHasScheduleToday(false);
          }
        } catch (err) {
          console.error("Error fetching employee data:", err);
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (lat && long) {
      const controller = new AbortController();
      const signal = controller.signal;

      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=cf3bf4d881f3fa46d34ed51b07a6e7f7&units=metric&lang=es`,
        { signal }
      )
        .then((res) => res.json())
        .then((data) => {
          setWeather({ ...data, name: locationName });
        })
        .catch((err) => console.log("Error fetching weather", err));

      return () => controller.abort();
    }
  }, [lat, long]);

  return (
    <Container>
      <ImageBackground source={bgImg} style={{ width: "100%", height: "100%" }}>
        <Greeting>Hola, {employeeName}</Greeting>

        <CurrentDate>{currentDate}</CurrentDate>

        {!hasScheduleToday ? (
          <FreeDayMessage>🏖️ Hoy es tu día de fiesta, ¡disfrútalo al máximo! 🎉</FreeDayMessage>
        ) : weather.main ? (
          <CurrentForecast currentWeather={weather} timezone={weather.timezone} />
        ) : (
          <NoWeather>No hay datos del clima disponibles</NoWeather>
        )}

        {hasScheduleToday && (  // Aquí agregamos la condición
            <>
              <MessageButtons>Directo a</MessageButtons>
              <ButtonsContainer>
                <ActionButton onPress={() => navigation.navigate("Fichar")}>
                  <ButtonText>📍 Fichar</ButtonText>
                </ActionButton>

                <ActionButton onPress={() => navigation.navigate("Incidencia")}>
                  <ButtonText>📝 Incidencia</ButtonText>
                </ActionButton>
              </ButtonsContainer>
            </>
        )}
      </ImageBackground>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: dodgerblue;
`;

const Greeting = styled.Text`
  font-size: 24px;
  color: white;
  margin: 40px 20px 10px 20px;
  font-weight: bold;
`;

const MessageButtons = styled.Text`
  font-size: 20px;
  color: white;
  margin: 40px 20px 1px 20px;
  font-weight: bold;
`;


const NoWeather = styled.Text`
  text-align: center;
  color: white;
  margin-top: 50px;
`;

const FreeDayMessage = styled.Text`
  text-align: center;
  color: white;
  font-size: 20px;
  margin-top: 50px;
  padding: 20px;
`;

const ButtonsContainer = styled.View`
  margin-top: 30px;
  padding: 0 20px;
  gap: 15px;
`;

const ActionButton = styled(TouchableOpacity)`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 15px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

const CurrentDate = styled.Text`
  font-size: 14px;
  color: white;
  margin: 0px 20px 20px;
  text-align: left;

`;

export default Dashboard;

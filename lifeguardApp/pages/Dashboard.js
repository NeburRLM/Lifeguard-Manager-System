import React, { useEffect, useState } from "react";
import { ScrollView, ImageBackground } from "react-native";
import ForecastSearch from "../components/ForecastSearch";
import CurrentForecast from "../components/CurrentForecast";
import DailyForecast from "../components/DailyForecast";
import styled from "styled-components/native";
import bgImg from "../assets/4.png";

const Dashboard = () => {
  const [toggleSearch, setToggleSearch] = useState("city");
  const [city, setCity] = useState("Toronto");
  const [postalCode, setPostalCode] = useState("L4W1S9");
  const [lat, setLat] = useState(43.6532);
  const [long, setLong] = useState(-79.3832);
  const [weather, setWeather] = useState({});

  const controller = new AbortController();
  const signal = controller.signal;


  //fetch lat long by city
  const fetchLatLongHandler = () => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Cambrils&appid=cf3bf4d881f3fa46d34ed51b07a6e7f7&units=metric&lang=es'`
    )
      .then((res) => res.json())
      .then((data) => {
        setLat(data.coord.lat);
        setLong(data.coord.lon);
        console.log("Weather Data:", data);
      });
  };

  //fetch lat long by postal code/zip since OpenWeather Api only accepts zips
  const fetchByPostalHandler = () => {
    fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=ca&format=json`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setLat(parseFloat(data[0].lat));
          setLong(parseFloat(data[0].lon));
        } else {
          console.log("Postal code not found");
        }
      })
      .catch((err) => console.log("Error fetching postal code", err));

  };

  //updates the weather when lat long changes
  useEffect(() => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Cambrils&appid=cf3bf4d881f3fa46d34ed51b07a6e7f7&units=metric&lang=es'`,
      { signal }
    )
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
      })
      .catch((err) => {
        console.log("error", err);
      });
    return () => controller.abort();
  }, [lat, long]);

  return (
    <Container>
      <ImageBackground source={bgImg} style={{ width: "100%", height: "100%" }}>
        <ForecastSearch
          city={city}
          setCity={setCity}
          fetchLatLongHandler={fetchLatLongHandler}
          toggleSearch={toggleSearch}
          setToggleSearch={setToggleSearch}
          fetchByPostalHandler={fetchByPostalHandler}
          setPostalCode={setPostalCode}
          postalCode={postalCode}
        />
        <CurrentForecast currentWeather={weather} timezone={weather.timezone} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
          <FutureForecastContainer>
            {weather.daily ? (
              weather.daily.map((day, index) => {
                if (index !== 0) {
                  return <DailyForecast key={day.dt} day={day} index={index} />;
                }
              })
            ) : (
              <NoWeather>No Weather to show</NoWeather>
            )}
          </FutureForecastContainer>
        </ScrollView>
      </ImageBackground>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: dodgerblue;
`;

const NoWeather = styled.Text`
  text-align: center;
  color: white;
`;

const FutureForecastContainer = styled.View`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default Dashboard;
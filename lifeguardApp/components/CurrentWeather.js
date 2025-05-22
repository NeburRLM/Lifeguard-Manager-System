import React from "react";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";

const CurrentForecast = ({ currentWeather }) => {
  const { t } = useTranslation();

  console.log("TIEMPOO -> ", currentWeather);

  return (
    <CurrentView>
      <Timezone>{currentWeather.name}</Timezone>
      <MainInfoContainer>
        <CurrentTempView>
          {currentWeather.weather && (
            <WeatherIcon
              source={{
                uri: `http://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`,
              }}
              resizeMode={"contain"}
            />
          )}
          <CurrentDegrees>
            {Math.round(currentWeather.main.temp)}°C
          </CurrentDegrees>
        </CurrentTempView>
        <Description>
          {currentWeather.weather && currentWeather.weather[0].description}
        </Description>
      </MainInfoContainer>
      <SecondaryInfoContainer>
        <Row>
          <DetailsBox>
            <Label>{t("forecast.feels")}</Label>
            <Details>{Math.round(currentWeather.main.feels_like)}°C</Details>
          </DetailsBox>
          <DetailsBox>
            <Label>{t("forecast.low")}</Label>
            <Details>{Math.round(currentWeather.main.temp_min)}°C</Details>
          </DetailsBox>
          <DetailsBox>
            <Label>{t("forecast.high")}</Label>
            <Details>{Math.round(currentWeather.main.temp_max)}°C</Details>
          </DetailsBox>
        </Row>
        <Row>
          <DetailsBox>
            <Label>{t("forecast.wind")}</Label>
            <Details>{currentWeather.wind.speed} m/s</Details>
          </DetailsBox>
          <DetailsBox>
            <Label>{t("forecast.humidity")}</Label>
            <Details>{currentWeather.main.humidity}%</Details>
          </DetailsBox>
          <DetailsBox>
            <Label>{t("forecast.rain")}</Label>
            <Details>{currentWeather.daily ? currentWeather.daily[0].rain : "0"} MM</Details>
          </DetailsBox>
        </Row>
      </SecondaryInfoContainer>
    </CurrentView>
  );
};

const CurrentView = styled.View`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const CurrentTempView = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const MainInfoContainer = styled.View`
  display: flex;
  align-items: center;
`;

const Description = styled.Text`
  color: white;
  font-size: 15px;
  text-transform: capitalize;
`;

const SecondaryInfoContainer = styled.View`
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 10px;
  width: 95%;
  max-width: 478px;
`;

const WeatherIcon = styled.Image`
  width: 50px;
  height: 50px;
`;

const Timezone = styled.Text`
  color: white;
  display: flex;
  justify-content: center;
  margin-top: 10px;
  font-size: 15px;
`;

const CurrentDegrees = styled.Text`
  color: white;
  display: flex;
  justify-content: center;
  margin-top: 10px;
  font-size: 60px;
`;

const Row = styled.View`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  color: black;
  padding: 10px 30px;
`;

const DetailsBox = styled.View`
  display: flex;
`;

const Label = styled.Text`
  font-size: 18px;
`;

const Details = styled.Text`
  color: black;
  font-size: 15px;
  text-transform: capitalize;
`;

export default CurrentForecast;

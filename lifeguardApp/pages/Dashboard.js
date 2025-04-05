import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [weather, setWeather] = useState('');
  const [weatherIcon, setWeatherIcon] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const res = await fetch(`http://192.168.1.34:4000/employee/${userId}`);
          const data = await res.json();
          setUserName(data.name);
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.weatherapi.com/v1/forecast.json?key=c4fb3b4a1ecb46f19b9233301250404&q=43850&days=1');
        const data = await res.json();
        setWeather(data.forecast.forecastday[0].day.condition.text);
        setWeatherIcon(data.forecast.forecastday[0].day.condition.icon);
      } catch (err) {
        console.error('Error fetching weather:', err);
      }
    };

    // Fetch user and weather on component mount
    fetchUser();
    fetchWeather();

    // Set interval to update weather at 10 PM every day
    const now = new Date();
    let millisTill10PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0, 0) - now;
    if (millisTill10PM < 0) {
      millisTill10PM += 86400000; // it's after 10 PM, set for 10 PM tomorrow.
    }
    const timeoutId = setTimeout(() => {
      fetchWeather();
      setInterval(fetchWeather, 86400000); // 24 hours in milliseconds
    }, millisTill10PM);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {userName}</Text>
      <Text style={styles.weather}>Weather: {weather}</Text>
      {weatherIcon ? <Image source={{ uri: `https:${weatherIcon}` }} style={styles.weatherIcon} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  weather: {
    fontSize: 18,
    color: '#666',
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginTop: 10,
  },
});

export default Dashboard;
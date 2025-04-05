import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Header from './Header';

const ScreenWrapper = ({ children }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Header />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});

export default ScreenWrapper;

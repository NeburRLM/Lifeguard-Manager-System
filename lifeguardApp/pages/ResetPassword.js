import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';


const ResetPassword = () => {
      const route = useRoute();
      const { token } = route.params || {};

      useEffect(() => {
        console.log("Token recibido:", token);
        // aquí ya podrías mostrar el input de nueva contraseña y hacer el fetch al backend
      }, [token]);
}

export default ResetPassword;
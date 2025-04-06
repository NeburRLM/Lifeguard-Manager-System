import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Modal, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Nomina = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`http://10.0.2.2:4000/employee/${userId}`);
          const employeeData = await response.json();
          setEmployeeName(employeeData.name);

          const payrollResponse = await fetch(`http://10.0.2.2:4000/payroll/${userId}`);
          const payrollData = await payrollResponse.json();
          const sorted = payrollData.sort(
            (a, b) => new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1)
          );
          setPayrolls(sorted);
          setFilteredPayrolls(sorted);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    filterPayrolls();
  }, [selectedMonth, selectedYear]);

  const filterPayrolls = () => {
    let filtered = payrolls;
    if (selectedMonth) filtered = filtered.filter(p => p.month === parseInt(selectedMonth));
    if (selectedYear) filtered = filtered.filter(p => p.year === parseInt(selectedYear));
    setFilteredPayrolls(filtered);
  };

  const openPayrollPdf = (payroll) => {
    // Lógica para abrir PDF aquí
    console.log("Abrir nómina PDF de:", payroll);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nóminas de {employeeName}</Text>

      <View style={styles.filterContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mes:</Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setIsMonthModalVisible(true)}
          >
            <Text style={styles.monthButtonText}>
              {selectedMonth ? monthNames[selectedMonth - 1] : 'Seleccionar mes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Año:</Text>
          <TextInput
            value={selectedYear}
            onChangeText={setSelectedYear}
            style={styles.textInput}
            keyboardType="numeric"
            placeholder="Escribe el año"
            placeholderTextColor="#aaa"
          />
        </View>
      </View>

      <FlatList
        data={filteredPayrolls}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.payrollItem}
            onPress={() => openPayrollPdf(item)}
          >
            <Text style={styles.payrollText}>
              {monthNames[item.month - 1]} {item.year}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal scrollable para selección de mes */}
      <Modal
        visible={isMonthModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {monthNames.map((name, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.monthOption}
                  onPress={() => {
                    setSelectedMonth((index + 1).toString());
                    setIsMonthModalVisible(false);
                  }}
                >
                  <Text style={styles.monthOptionText}>{name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.monthOption, { backgroundColor: '#f5f5f5' }]}
                onPress={() => {
                  setSelectedMonth('');
                  setIsMonthModalVisible(false);
                }}
              >
                <Text style={[styles.monthOptionText, { color: '#d00' }]}>Limpiar selección</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity onPress={() => setIsMonthModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Estilos modernos y responsivos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#222',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  monthButton: {
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  monthButtonText: {
    color: '#333',
    fontSize: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#333',
  },
  payrollItem: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 12,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  payrollText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  monthOption: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  monthOptionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 14,
    color: '#007AFF',
    fontSize: 16,
  },
});

export default Nomina;

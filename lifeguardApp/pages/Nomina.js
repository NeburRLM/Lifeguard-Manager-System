import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Modal, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import moment from "moment";
import "moment/locale/es";

const Nomina = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
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
          setEmployeeData(employeeData);

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

  const openPayrollPdf = async (payroll) => {
    try {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

      const monthName = capitalize(moment().month(payroll.month - 1).format("MMMM"));

      const earnings = JSON.parse(payroll.earnings);
      const deductions = JSON.parse(payroll.deductions);

      const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const netTotal = totalEarnings - totalDeductions;

      const hireDateFormatted = new Date(employeeData.hire_date).toLocaleDateString("es-ES");

      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial;
                padding: 65px 20px 20px 20px;
                font-size: 12px;
              }
              h1 {
                text-align: center;
                font-size: 18px;
              }
              p {
                margin: 2px 0;
                line-height: 1.3;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                border: 1px solid #000;
                padding: 6px;
                text-align: center;
              }
              th {
                background-color: #f0f0f0;
              }
              .section-title {
                margin-top: 20px;
                font-weight: bold;
                font-size: 14px;
              }
              .label-strong {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <h1>NÓMINA - ${payroll.month}/${payroll.year}</h1>
            <p><strong>EMPRESA:</strong> LIFEGUARD COMPANY, S.L.</p>
            <p><strong>CIF:</strong> B00000000</p>
            <p><strong>DIRECCIÓN:</strong> CL SOCO, 0 - 43850 CAMBRILS</p>
            <p><strong>TRABAJADOR:</strong> ${employeeData.name}</p>
            <p><strong>DNI:</strong> ${payroll.employee_id}</p>
            <p><strong>CATEGORIA:</strong> ${employeeData.role}</p>
            <p><strong>FECHA DE ALTA:</strong> ${hireDateFormatted}</p>
            <p><strong>PERÍODO DE LIQUIDACIÓN:</strong> DEL 01 AL 31 ${monthName} ${payroll.year}</p>

            <div class="section-title">Conceptos Devengados</div>
            <table>
              <tr><th>Concepto</th><th>Importe (€)</th></tr>
              ${earnings.map(e => `
                <tr>
                  <td>${e.name}</td>
                  <td>${e.amount}</td>
                </tr>
              `).join('')}
            </table>

            <div class="section-title">Deducciones</div>
            <table>
              <tr><th>Concepto</th><th>Porcentaje</th><th>Importe (€)</th></tr>
              ${deductions.map(d => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.percentage}</td>
                  <td>${d.amount}</td>
                </tr>
              `).join('')}
            </table>

            <div class="section-title">Totales</div>
            <table>
              <tr><td class="label-strong">Total Horas</td><td>${payroll.total_hours}</td></tr>
              <tr><td class="label-strong">Total Devengado</td><td>${totalEarnings.toFixed(2)} €</td></tr>
              <tr><td class="label-strong">Total Deducciones</td><td>${totalDeductions.toFixed(2)} €</td></tr>
              <tr><td class="label-strong">Total Neto</td><td>${netTotal.toFixed(2)} €</td></tr>
            </table>
            <p style="margin-top: 10px;">Abonado en cuenta: ES00-0000-0000**************</p>
          </body>
        </html>
      `;


      const file = await printToFileAsync({ html, base64: false });
      await shareAsync(file.uri);
    } catch (error) {
      console.error("Error generando PDF:", error);
    }
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

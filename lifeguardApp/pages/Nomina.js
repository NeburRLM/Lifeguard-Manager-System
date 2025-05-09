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
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

const Nomina = () => {
  const { t } = useTranslation();
  const API_URL = Constants.expoConfig.extra.API_URL;
  const [employeeName, setEmployeeName] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  const monthNames = [
      t('nomina.monthNames.january'),
      t('nomina.monthNames.february'),
      t('nomina.monthNames.march'),
      t('nomina.monthNames.april'),
      t('nomina.monthNames.may'),
      t('nomina.monthNames.june'),
      t('nomina.monthNames.july'),
      t('nomina.monthNames.august'),
      t('nomina.monthNames.september'),
      t('nomina.monthNames.october'),
      t('nomina.monthNames.november'),
      t('nomina.monthNames.december'),
    ];

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/employee/${userId}`);
          const employeeData = await response.json();
          setEmployeeName(employeeData.name);
          setEmployeeData(employeeData);

          const payrollResponse = await fetch(`${API_URL}/payroll/${userId}`);
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
            <h1>${t('nomina.payroll')} - ${payroll.month}/${payroll.year}</h1>
            <p><strong>${t('nomina.company')}</strong> LIFEGUARD COMPANY, S.L.</p>
            <p><strong>${t('nomina.cif')}</strong> B00000000</p>
            <p><strong>${t('nomina.address')}</strong> CL SOCO, 0 - 43850 CAMBRILS</p>
            <p><strong>${t('nomina.employee')}</strong> ${employeeData.name}</p>
            <p><strong>${t('nomina.dni')}</strong> ${payroll.employee_id}</p>
            <p><strong>${t('nomina.category')}</strong> ${employeeData.role}</p>
            <p><strong>${t('nomina.hireDate')}</strong> ${hireDateFormatted}</p>
            <p><strong>${t('nomina.settlementPeriod')}</strong> ${t('nomina.from')} 01 ${t('nomina.to')} 31 ${monthName} ${payroll.year}</p>

            <div class="section-title">${t('nomina.conceptsEarned')}</div>
            <table>
              <tr><th>${t('nomina.concept2')}</th><th>${t('nomina.import')} (€)</th></tr>
              ${earnings.map(e => `
                <tr>
                  <td>${e.name}</td>
                  <td>${e.amount}</td>
                </tr>
              `).join('')}
            </table>

            <div class="section-title">${t('nomina.deductions')}</div>
            <table>
              <tr><th>${t('nomina.concept2')}</th><th>${t('nomina.percentage')}</th><th>${t('nomina.import')} (€)</th></tr>
              ${deductions.map(d => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.percentage}</td>
                  <td>${d.amount}</td>
                </tr>
              `).join('')}
            </table>

            <div class="section-title">${t('nomina.totals')}</div>
            <table>
              <tr><td class="label-strong">${t('nomina.totalHours')}</td><td>${payroll.total_hours}</td></tr>
              <tr><td class="label-strong">${t('nomina.totalEarned')}</td><td>${totalEarnings.toFixed(2)} €</td></tr>
              <tr><td class="label-strong">${t('nomina.totalDeductions')}</td><td>${totalDeductions.toFixed(2)} €</td></tr>
              <tr><td class="label-strong">${t('nomina.totalNet')}</td><td>${netTotal.toFixed(2)} €</td></tr>
            </table>
            <p style="margin-top: 10px;">${t('nomina.paidToAccount')} ES00-0000-0000**************</p>
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
      <Text style={styles.header}>{t('nomina.header', { name: employeeName })}</Text>

      <View style={styles.filterContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('nomina.month')}</Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setIsMonthModalVisible(true)}
          >
            <Text style={styles.monthButtonText}>
              {selectedMonth ? monthNames[selectedMonth - 1] : t('nomina.selectMonth')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('nomina.year')}</Text>
          <TextInput
            value={selectedYear}
            onChangeText={setSelectedYear}
            style={styles.textInput}
            keyboardType="numeric"
            placeholder={t('nomina.writeYear')}
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
                <Text style={[styles.monthOptionText, { color: '#d00' }]}>{t('nomina.clearSelection')}</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity onPress={() => setIsMonthModalVisible(false)}>
              <Text style={styles.cancelText}>{t('nomina.cancel')}</Text>
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

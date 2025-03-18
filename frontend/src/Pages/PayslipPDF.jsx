import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Estilos del PDF
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: "Helvetica" },
  section: { marginBottom: 10 },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  text: { fontSize: 10, marginBottom: 3 },
  table: { display: "table", width: "100%", borderWidth: 1, borderColor: "#000", marginTop: 10 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  cellHeader: { flex: 1, fontWeight: "bold", padding: 4, backgroundColor: "#f0f0f0", textAlign: "center" },
  cell: { flex: 1, padding: 4, textAlign: "center" },
  space: { marginBottom: 20 }, // añadir espacio
});

const PayslipPDF = ({ employee, payroll }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>NÓMINA - {payroll.month} {payroll.year}</Text>

      <View style={styles.section}>
        <Text style={styles.text}>EMPRESA: {payroll.company}</Text>
        <Text style={styles.text}>CIF: {payroll.cif}</Text>
        <Text style={styles.text}>DIRECCIÓN: {payroll.address}</Text>
        <Text style={styles.text}>TRABAJADOR: {employee.name}</Text>
        <Text style={styles.text}>DNI: {employee.id}</Text>
        <Text style={styles.text}>CATEGORÍA: {employee.role}</Text>
        <Text style={styles.text}>FECHA DE ALTA:</Text>
        <Text style={styles.text}>PERÍODO DE LIQUIDACIÓN: {payroll.period}</Text>
      </View>

      {/* Tabla de Devengado */}
      <Text style={styles.title}>CONCEPTOS DEVENGADOS</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellHeader}>Concepto</Text>
          <Text style={styles.cellHeader}>Importe (€)</Text>
        </View>
        {payroll.earnings.map((earning) => (
          <View style={styles.row} key={earning.name}>
            <Text style={styles.cell}>{earning.name}</Text>
            <Text style={styles.cell}>{earning.amount}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.space} />

      {/* Tabla de Deducciones */}
      <Text style={styles.title}>DEDUCCIONES</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellHeader}>Concepto</Text>
          <Text style={styles.cellHeader}>Porcentaje</Text>
          <Text style={styles.cellHeader}>Importe (€)</Text>
        </View>
        {payroll.deductions.map((deduction) => (
          <View style={styles.row} key={deduction.name}>
            <Text style={styles.cell}>{deduction.name}</Text>
            <Text style={styles.cell}>{deduction.percentage}%</Text>
            <Text style={styles.cell}>{deduction.amount}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.space} />

      {/* Totales */}
      <Text style={styles.title}>TOTALES</Text>
      <View style={styles.table}>
        <View style={styles.row}><Text style={styles.cellHeader}>Total Devengado</Text><Text style={styles.cell}>{payroll.totalEarned}</Text></View>
        <View style={styles.row}><Text style={styles.cellHeader}>Total Deducciones</Text><Text style={styles.cell}>{payroll.totalDeductions}</Text></View>
        <View style={styles.row}><Text style={styles.cellHeader}>Total Neto</Text><Text style={styles.cell}>{payroll.netSalary} €</Text></View>
      </View>

       <View style={styles.space} />
      <Text style={styles.text}>Abonado en cuenta: {payroll.bankAccount}</Text>
    </Page>
  </Document>
);

export default PayslipPDF;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaSort } from "react-icons/fa";
import "./PayrollsView.css";

function PayrollsView() {
  const { id } = useParams(); // Obtener el ID del empleado de la URL
  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc"); // Controlar el orden de las nóminas

  // Cargar los datos del empleado y sus nóminas
useEffect(() => {
  console.log("employeeId from URL:", id);
  const fetchEmployeeData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/employee/${id}`);
        const data = await response.json();
        setEmployee(data);
      } catch (error) {
        console.error("Error al obtener los datos del empleado:", error);
      }
    };

    const fetchPayrollsData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/payroll/${id}`);
        const data = await response.json();
        setPayrolls(data);
      } catch (error) {
        console.error("Error al obtener las nóminas:", error);
      }
    };

      fetchEmployeeData();
      fetchPayrollsData();
}, [id]);  // Añadir las funciones aquí




  const handleSort = () => {
    const sortedPayrolls = [...payrolls];
    sortedPayrolls.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.month - b.month || a.year - b.year;
      } else {
        return b.month - a.month || b.year - a.year;
      }
    });
    setPayrolls(sortedPayrolls);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Cambiar el orden
  };

  return (
    <div className="payroll-details-container">
      {employee && (
        <div className="employee-info">
          <img
            src={employee.image || "/default-avatar.jpg"}
            alt={employee.name}
            className="employee-image"
          />
          <h2>{employee.name}</h2>
        </div>
      )}

      <div className="payrolls-container">
        <div className="controls">
          <button onClick={handleSort} className="sort-btn">
            Sort by Month/Year {sortOrder === "asc" ? "↑" : "↓"} <FaSort />
          </button>
        </div>

        <table className="payroll-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Year</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => (
              <tr key={`${payroll.month}-${payroll.year}`}>
                <td>{payroll.month}</td>
                <td>{payroll.year}</td>
                <td>{payroll.amount} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayrollsView;

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { FaSort } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import "./PayrollsView.css";

function PayrollsView() {
  const { id } = useParams(); // Obtener el ID del empleado de la URL
  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc"); // Controlar el orden de las nóminas
  const [searchMonth, setSearchMonth] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const { t } = useTranslation();

  // Cargar los datos del empleado y sus nóminas
  useEffect(() => {
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
        setPayrolls(sortPayrolls(data)); // Ordenar las nóminas al obtenerlas
        setFilteredPayrolls(sortPayrolls(data));
      } catch (error) {
        console.error("Error al obtener las nóminas:", error);
      }
    };

    fetchEmployeeData();
    fetchPayrollsData();
  }, [id]);


  const handleSort = () => {
    const sortedPayrolls = [...filteredPayrolls];
    sortedPayrolls.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.year - b.year || a.month - b.month;
      } else {
        return b.year - a.year || b.month - a.month;
      }
    });
    setFilteredPayrolls(sortedPayrolls);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Cambiar el orden
  };

  const sortPayrolls = (payrollData) => {
    return payrollData.sort((a, b) => {
      return a.year - b.year || a.month - b.month; // Orden ascendente
    });
  };

  const handleSearch = useCallback(() => {
      if (searchMonth === "" && searchYear === "") {
        setFilteredPayrolls(payrolls); // Mostrar todas las nóminas si los campos de búsqueda están vacíos
      } else {
        const filtered = payrolls.filter(
          (payroll) =>
            (searchMonth === "" || payroll.month === parseInt(searchMonth)) &&
            (searchYear === "" || payroll.year === parseInt(searchYear))
        );
        setFilteredPayrolls(filtered);
      }
    }, [searchMonth, searchYear, payrolls]);

     useEffect(() => {
       handleSearch();
     }, [searchMonth, searchYear, handleSearch]);

  return (

      <main className="content">
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
              <form className="search-form">
                <input
                  type="number"
                  placeholder={t("payrolls-view.month")}
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  className="search-input"
                />
                <input
                  type="number"
                  placeholder={t("payrolls-view.year")}
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                  className="search-input"
                />
              </form>
              <button onClick={handleSort} className="sort-btn">
                {t("payrolls-view.sort")} {sortOrder === "asc" ? "↑" : "↓"} <FaSort />
              </button>
            </div>

            <table className="payroll-table">
              <thead>
                <tr>
                  <th>{t("payrolls-view.month")}</th>
                  <th>{t("payrolls-view.year")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="payroll-row">
                    <td>
                      <Link to={`/payrollsview/${id}/payroll/${payroll.id}?month=${payroll.month}&year=${payroll.year}`} className="payroll-row-link">
                        {payroll.month}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/payrollsview/${id}/payroll/${payroll.id}?month=${payroll.month}&year=${payroll.year}`} className="payroll-row-link">
                        {payroll.year}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  );
}

export default PayrollsView;

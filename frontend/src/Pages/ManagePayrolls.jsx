import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./ManagePayrolls.css";

function ManagePayrolls() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [roleSalaries, setRoleSalaries] = useState([]);
 const { t } = useTranslation();

  useEffect(() => {
    fetch("http://localhost:4000/employees")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setEmployees(data);
          setFilteredEmployees(data);
        } else {
          alert(t("manage-payrolls.error-employees"));
        }
      })
      .catch((error) => console.log("Error fetching employees:", error));
  }, [t]);


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    const normalizeString = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    setFilteredEmployees(
      employees.filter((employee) => {
        return (
          (employee.name && normalizeString(employee.name).includes(normalizeString(value))) ||
          (employee.id && normalizeString(employee.id).includes(normalizeString(value)))
        );
      })
    );
  };

  const handleSort = () => {
    const sortedEmployees = [...filteredEmployees];
    sortedEmployees.sort((a, b) => {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    setFilteredEmployees(sortedEmployees);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const fetchRoleSalaries = async () => {
    const response = await fetch("http://localhost:4000/role_salary");
    const data = await response.json();
    setRoleSalaries(data);
  };

  const handleInputChange = (role, type, index, field, value) => {
    setRoleSalaries((prev) =>
      prev.map((r) =>
        r.role === role
          ? {
              ...r,
              [type]: r[type].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
              ),
            }
          : r
      )
    );
  };

  const handleBaseSalaryChange = (role, value) => {
    setRoleSalaries((prev) =>
      prev.map((r) =>
        r.role === role ? { ...r, base_salary: value } : r
      )
    );
  };

  const generatePayrolls = async () => {
    if (!month || !year) {
      alert(t("manage-payrolls.select-month-year"));
      return;
    }
 try {
    const response = await fetch("http://localhost:4000/payroll/generate-monthly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, year }),
    });

    const data = await response.json();
    if (response.ok) {
          let message =  t("manage-payrolls.success");

          // Manejar el código 207 que indica errores parciales
          if (response.status === 207) {
            message = t("manage-payrolls.partial-error", { errors: data.errors.join("\n") });
          }

          alert(message);
          setShowModal(false);
        } else {
          alert(data.error || t("manage-payrolls.error-generate"));
        }
      } catch (error) {
        console.error("Error al generar nóminas:", error);
        alert(t("manage-payrolls.server-error"));
      }
  };

  const updateRoleSalaries = async () => {
    for (const roleSalary of roleSalaries) {
      const response = await fetch(`http://localhost:4000/role_salary/${roleSalary.role}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_salary: roleSalary.base_salary,
          earnings: roleSalary.earnings,
          deductions: roleSalary.deductions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || t("manage-payrolls.error-update"));
        return;
      }
    }
  };

  const handleGeneratePayrolls = async () => {
    await updateRoleSalaries();
    generatePayrolls();
  };

  return (
    <main className="content">
        <header className="header">
          <h4>{t("manage-payrolls.manage-payrolls")}</h4>
        </header>

        <div className="payroll-container">
          <h2>{t("manage-payrolls.employee-list")}</h2>

          <div className="select-container">
            <button onClick={() => { fetchRoleSalaries(); setShowModal(true); }} className="generate-payroll-btn">
              {t("manage-payrolls.generate-payrolls")}
            </button>
          </div>

          <div className="controls">
            <input
              type="text"
              placeholder={t("manage-payrolls.search")}
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button onClick={handleSort} className="sort-btn">
              {t("manage-payrolls.sort")} {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          <table className="payroll-table">
            <thead>
              <tr>
                <th>{t("manage-payrolls.employee-name")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <Link to={`/payrollsview/${employee.id}`} className="view-payroll-btn">
                      {employee.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t("manage-payrolls.generate-modal-title")}</h3>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
                          <option value="">{t("manage-payrolls.select-month")}</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {t(`months.${i + 1}`)}
                            </option>
                          ))}
                        </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="year-input"
              placeholder={t("manage-payrolls.select-year")}
            />
            {roleSalaries.map((roleSalary) => (
              <div key={roleSalary.role} className="role-salary">
                <h4>{roleSalary.role}</h4>
                <div className="role-salary-section">
                  <label>{t("manage-payrolls.base-salary")}</label>
                  <input
                    type="number"
                    value={roleSalary.base_salary}
                    onChange={(e) => handleBaseSalaryChange(roleSalary.role, e.target.value)}
                  />
                </div>
                <div className="role-salary-section">
                  <h5>{t("manage-payrolls.earnings")}</h5>
                  {roleSalary.earnings.map((earning, index) => (
                                      earning.name !== "Salario Base" && (
                                        <div key={index} className="role-salary-item">
                                          <label>{earning.name}:</label>
                                          <input
                                            type="number"
                                            value={earning.amount}
                                            onChange={(e) => handleInputChange(roleSalary.role, "earnings", index, "amount", e.target.value)}
                                          />
                                        </div>
                                      )
                                    ))}
                </div>
                <div className="role-salary-section">
                  <h5>{t("manage-payrolls.deductions")}</h5>
                  {roleSalary.deductions.map((deduction, index) => (
                    <div key={index} className="role-salary-item">
                      <label>{deduction.name} ({deduction.percentage}%):</label>
                      <input
                        type="number"
                        value={deduction.percentage}
                        onChange={(e) => handleInputChange(roleSalary.role, "deductions", index, "percentage", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="modal-bts">
              <button onClick={handleGeneratePayrolls} className="generate-btn">{t("manage-payrolls.generate")}</button>
              <button onClick={() => setShowModal(false)} className="cl-btn">{t("manage-payrolls.cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ManagePayrolls;

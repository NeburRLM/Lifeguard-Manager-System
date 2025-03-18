import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "./ManagePayrolls.css";

function ManagePayrolls() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [roleSalaries, setRoleSalaries] = useState([]);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/", { replace: true });
    window.history.pushState(null, "", "/");
  };

  useEffect(() => {
    fetchData();
    fetch("http://localhost:4000/employees")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setEmployees(data);
          setFilteredEmployees(data);
        } else {
          alert("No employees found");
        }
      })
      .catch((error) => console.log("Error fetching employees:", error));
  }, []);

  const fetchData = () => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  };

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
      alert("Selecciona un mes y un año.");
      return;
    }

    const response = await fetch("http://localhost:4000/payroll/generate-monthly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, year }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Nóminas generadas correctamente.");
      setShowModal(false);
    } else {
      alert(data.error || "Error al generar nóminas.");
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
        alert(data.message || "Error updating role salary");
        return;
      }
    }
  };

  const handleGeneratePayrolls = async () => {
    await updateRoleSalaries();
    generatePayrolls();
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>
        {user && (
          <div className="user-profile">
            <img
              src={user.image || "/default-avatar.jpg"}
              alt={user.name}
              className="profile-image"
            />
            <p className="user-name">{user.name}</p>
          </div>
        )}
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/facilities">Manage Facilities</Link></li>
            <li><Link to="/payrolls">Manage Payrolls</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button className="logout-btn" onClick={signOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="content">
        <header className="header">
          <h4>Manage Payrolls</h4>
        </header>

        <div className="payroll-container">
          <h2>Employee List</h2>

          <div className="select-container">
            <button onClick={() => { fetchRoleSalaries(); setShowModal(true); }} className="generate-payroll-btn">
              Generar Nóminas
            </button>
          </div>

          <div className="controls">
            <input
              type="text"
              placeholder="Buscar por nombre o DNI"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button onClick={handleSort} className="sort-btn">
              Ordenar Alfabéticamente {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee Name</th>
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
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Generar Nómina</h3>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Selecciona un mes</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="year-input"
              placeholder="Año"
            />
            {roleSalaries.map((roleSalary) => (
              <div key={roleSalary.role} className="role-salary">
                <h4>{roleSalary.role}</h4>
                <div className="role-salary-section">
                  <label>Base Salary:</label>
                  <input
                    type="number"
                    value={roleSalary.base_salary}
                    onChange={(e) => handleBaseSalaryChange(roleSalary.role, e.target.value)}
                  />
                </div>
                <div className="role-salary-section">
                  <h5>Earnings:</h5>
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
                  <h5>Deductions:</h5>
                  {roleSalary.deductions.map((deduction, index) => (
                    <div key={index} className="role-salary-item">
                      <label>{deduction.name} ({deduction.percentage}%):</label>
                      <input
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => handleInputChange(roleSalary.role, "deductions", index, "amount", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="modal-bts">
              <button onClick={handleGeneratePayrolls} className="generate-btn">Generar</button>
              <button onClick={() => setShowModal(false)} className="cl-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePayrolls;

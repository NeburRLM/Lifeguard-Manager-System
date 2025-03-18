import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaSort } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import "./PayrollsView.css";

function PayrollsView() {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID del empleado de la URL
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc"); // Controlar el orden de las nóminas
  const [searchMonth, setSearchMonth] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/", { replace: true });
    window.history.pushState(null, "", "/");
  };

  // Cargar los datos del empleado y sus nóminas
  useEffect(() => {
    fetchData();
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

  const fetchData = () => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  };

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
                  placeholder="Month"
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  className="search-input"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                  className="search-input"
                />
              </form>
              <button onClick={handleSort} className="sort-btn">
                Sort by Month/Year {sortOrder === "asc" ? "↑" : "↓"} <FaSort />
              </button>
            </div>

            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Year</th>
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
    </div>
  );
}

export default PayrollsView;

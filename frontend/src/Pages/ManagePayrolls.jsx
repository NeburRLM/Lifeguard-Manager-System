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
  const [sortOrder, setSortOrder] = useState("asc"); // Para controlar el orden de la lista

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
          setFilteredEmployees(data); // Establecemos la lista filtrada inicial
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
    const value = e.target.value; // Mantenemos la entrada tal como está
    setSearchTerm(value);

    // Función para normalizar y convertir a minúsculas (eliminando acentos y respetando mayúsculas/minúsculas)
    const normalizeString = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); // Elimina acentos y pasa a minúsculas
    };

    setFilteredEmployees(
      employees.filter((employee) => {
        // Verifica si el nombre o el id (dni) contiene el valor de búsqueda (sin importar mayúsculas, minúsculas ni acentos)
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
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setFilteredEmployees(sortedEmployees);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Cambia el orden de clasificación
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
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      <main className="content">
        <header className="header">
          <h4>Manage Payrolls</h4>
        </header>

        <div className="payroll-container">
          <h2>Employee List</h2>
          <div className="controls">
            {/* Buscador */}
            <input
              type="text"
              placeholder="Search by name or DNI"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {/* Botón de ordenar */}
            <button onClick={handleSort} className="sort-btn">
              Sort Alphabetically {sortOrder === "asc" ? "↑" : "↓"}
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
    </div>
  );
}

export default ManagePayrolls;
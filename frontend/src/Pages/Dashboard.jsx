//import React from "react";
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [employeeCount, setEmployeeCount] = useState(0);
  const [bossCount, setBossCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0); // Estado para facilities
  const [loading, setLoading] = useState(true); // Estado para cargar

  const signOut = () => {
    sessionStorage.removeItem("Token");
    navigate("/");
  };

  // Obtener datos desde el backend (usando fetch)
     // Obtener datos desde el backend (usando fetch)
      const fetchData = () => {
        // Obtener el conteo de empleados
        fetch("http://localhost:4000/employeeCount")
          .then((response) => response.json())
          .then((data) => {
            setEmployeeCount(data.employee || 0); // Establecer el conteo de empleados
          })
          .catch((err) => console.log("Error fetching employee count:", err));

        // Obtener el conteo de jefes (Boss)
        fetch("http://localhost:4000/bossCount")
          .then((response) => response.json())
          .then((data) => {
            setBossCount(data.boss || 0); // Establecer el conteo de jefes
          })
          .catch((err) => console.log("Error fetching boss count:", err));

        // Obtener el conteo de facilities
        fetch("http://localhost:4000/facilityCount") // Nueva ruta para obtener facilities
          .then((response) => response.json())
          .then((data) => {
            setFacilityCount(data.facility || 0); // Establecer el conteo de facilities
          })
          .catch((err) => console.log("Error fetching facility count:", err))
          .finally(() => setLoading(false)); // Cuando los datos se cargan, dejamos de mostrar el loading
      };



    // Usar useEffect para obtener los datos al cargar el componente y actualizar periódicamente
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Actualizar cada 5 segundos
        return () => clearInterval(interval); // Limpiar el intervalo cuando el componente se desmonte
      }, []);


  return (
      <div className="dashboard-container">
        <aside className="sidebar">
          <h2 className="logo">Admin Dashboard</h2>
          <nav>
            <ul>
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/employee">Manage Employees</Link>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <button className="logout-btn" onClick={signOut}>
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="content">
          <header className="header">
            <h4>Employee Management System</h4>
          </header>
          <section className="main-section">
            <div className="stats-container">
              <div className="stat-card">
                <h4>Employees</h4>
                {loading ? <p>Loading...</p> : <p>Total Employees: {employeeCount}</p>}
              </div>
              <div className="stat-card">
                <h4>Bosses</h4>
                {loading ? <p>Loading...</p> : <p>Total Bosses: {bossCount}</p>}
              </div>
              {/* Nuevo panel para Facility */}
              <div className="stat-card">
                <h4>Facilities</h4>
                {loading ? <p>Loading...</p> : <p>Total Facilities: {facilityCount}</p>}
              </div>
            </div>
            <Outlet />
          </section>
        </main>
      </div>
    );
  }

  export default Dashboard;

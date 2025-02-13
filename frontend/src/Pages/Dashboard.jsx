import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserTie, faBuilding } from "@fortawesome/free-solid-svg-icons";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [employeeCount, setEmployeeCount] = useState(0);
  const [bossCount, setBossCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    navigate("/");
  };

  const fetchData = () => {
    fetch("http://localhost:4000/employeeCount")
      .then((response) => response.json())
      .then((data) => setEmployeeCount(data.employee || 0))
      .catch((err) => console.log("Error fetching employee count:", err));

    fetch("http://localhost:4000/bossCount")
      .then((response) => response.json())
      .then((data) => setBossCount(data.boss || 0))
      .catch((err) => console.log("Error fetching boss count:", err));

    fetch("http://localhost:4000/facilityCount")
      .then((response) => response.json())
      .then((data) => setFacilityCount(data.facility || 0))
      .catch((err) => console.log("Error fetching facility count:", err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><button className="logout-btn" onClick={signOut}>Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <header className="header">
          <h4>Employee Management System</h4>
        </header>

        {/* Sección principal con las tarjetas */}
        <section className="main-section">
          <div className="stats-container">
            <div className="stat-card">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <h4>Employees</h4>
              <p className="number">{employeeCount}</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faUserTie} className="stat-icon" />
              <h4>Bosses</h4>
              <p className="number">{bossCount}</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faBuilding} className="stat-icon" />
              <h4>Facilities</h4>
              <p className="number">{facilityCount}</p>
            </div>
          </div>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

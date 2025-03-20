import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserTie, faBuilding } from "@fortawesome/free-solid-svg-icons";
import "./Dashboard.css";

function Dashboard() {

  const [employeeCount, setEmployeeCount] = useState(0);
  const [bossCount, setBossCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0);


  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [employeeRes, bossRes, facilityRes] = await Promise.all([
        fetch("http://localhost:4000/employeeCount").then((res) => res.json()),
        fetch("http://localhost:4000/bossCount").then((res) => res.json()),
        fetch("http://localhost:4000/facilityCount").then((res) => res.json()),
      ]);

      setEmployeeCount(employeeRes.employee || 0);
      setBossCount(bossRes.boss || 0);
      setFacilityCount(facilityRes.facility || 0);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

return (
    <main className="content">
      <header className="header">
        <h4>Employee Management System</h4>
      </header>

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
      </section>
    </main>
  );
}

export default Dashboard;

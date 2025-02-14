import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCalendarAlt } from "react-icons/fa"; // Añadir iconos
import "./EmployeeView.css"; // Archivo CSS mejorado

const EmployeeView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/");
  };

  useEffect(() => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => setEmployee(data))
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id]);

  if (!employee) return <div className="loading">Loading...</div>;

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
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <header className="header">
          <h4>Employee Details</h4>
        </header>

        {/* Detalles del empleado con imagen */}
        <div className="employee-details-container">
          <div className="employee-info">
            <img
                src={employee.image || "/default-avatar.jpg"}
                alt={employee.name}
                className="employee-image"
              />
            <div className="details-grid">
              <h2>{employee.name}</h2>
              <p><strong>Email:</strong> {employee.email}</p>
              <p><strong>Role:</strong> {employee.role}</p>
              <p><strong>Birthdate:</strong> {employee.birthdate}</p>
              <p><strong>Phone:</strong> {employee.phone_number}</p>
              <p><strong>Hourly Rate:</strong> ${employee.hourlyRate}</p>
            </div>
          </div>
        </div>

        {/* Cuadrantes de trabajo */}
        <div className="schedule-container">
          <h3>Work Schedule for {employee.name}</h3>
          <ul className="schedule-list">
            {employee.work_schedule.map((schedule) => (
              <li key={schedule.id} className="schedule-item">
                <Link to={`/employeeview/${id}/schedule/${schedule.id}`} className="schedule-link">
                  <FaCalendarAlt /> {schedule.month}-{schedule.year}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default EmployeeView;

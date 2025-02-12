import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem("Token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="content">
        <header className="header">
          <h4>Employee Management System</h4>
        </header>
        <section className="main-section">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

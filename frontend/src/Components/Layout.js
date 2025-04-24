import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "./Dashboard.css"; // Usa el mismo CSS de Dashboard

function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  }, [user]);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/", { replace: true });
    window.history.pushState(null, "", "/");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar persistente */}
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>

        {user && (
          <div className="user-profile">
            <img src={user.image || "/default-avatar.jpg"} alt={user.name} className="profile-image" />
            <p className="user-name">{user.name}</p>
          </div>
        )}

        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/facilities">Manage Facilities</Link></li>
            <li><Link to="/payrolls">Manage Payrolls</Link></li>
            <li><Link to="/incidents">Manage Incidents</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido dinámico (Outlet) */}
      <main className="contentLayout">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

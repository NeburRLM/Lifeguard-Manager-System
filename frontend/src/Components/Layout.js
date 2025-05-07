import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "./Dashboard.css"; // Usa el mismo CSS de Dashboard
import { useTranslation } from 'react-i18next';


function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { t, i18n } = useTranslation();

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

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };


  return (
    <div className="dashboard-container">
      {/* Sidebar persistente */}
      <aside className="sidebar">
        <h2 className="logo">{t('layout.Admin Dashboard')}</h2>

        {user && (
          <div className="user-profile">
            <img src={user.image || "/default-avatar.jpg"} alt={user.name} className="profile-image" />
            <p className="user-name">{user.name}</p>


        </div>

        )}

        <nav>
          <ul>
            <li><Link to="/dashboard">{t('layout.Dashboard')}</Link></li>
                        <li><Link to="/employees">{t('layout.Manage Employees')}</Link></li>
                        <li><Link to="/facilities">{t('layout.Manage Facilities')}</Link></li>
                        <li><Link to="/payrolls">{t('layout.Manage Payrolls')}</Link></li>
                        <li><Link to="/incidents">{t('layout.Manage Incidents')}</Link></li>
                        <li><Link to="/profile">{t('layout.Profile')}</Link></li>
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> {t('layout.Sign Out')}</button></li>
          </ul>
        </nav>
        <div className="language-selectorLayout">
                      <img
                        src={`/flags/${i18n.language === "en" ? "gb" : i18n.language}.png`}
                        alt="flag"
                        className="flag-iconLayout"
                      />
                      <select onChange={handleLanguageChange} value={i18n.language}>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="ca">Català</option>
                      </select>
                    </div>
      </aside>

      {/* Contenido dinámico (Outlet) */}
      <main className="contentLayout">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

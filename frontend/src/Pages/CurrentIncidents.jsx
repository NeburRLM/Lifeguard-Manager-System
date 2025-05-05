// src/pages/CurrentIncidents.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageIncidents.css"; // Reutilizamos los estilos existentes
import { useTranslation } from "react-i18next";

function CurrentIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`http://localhost:4000/incidents/today`)
      .then(res => res.json())
      .then(data => {
        setIncidents(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching incidents:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="content">
      <header className="header">
        <h4>{t("currentIncidents.title")} - {new Date().toLocaleDateString("es-ES")}</h4>
      </header>

      <div className="incident-container">
        <h2>{t("currentIncidents.listTitle")}</h2>

        {loading ? (
          <p>{t("currentIncidents.loading")}</p>
        ) : incidents.length === 0 ? (
          <p>{t("currentIncidents.noIncidents")}</p>
        ) : (
          <table className="incident-table">
            <thead>
              <tr>
                <th>{t("currentIncidents.table.type")}</th>
                <th>{t("currentIncidents.table.time")}</th>
                <th>{t("currentIncidents.table.facility")}</th>
                <th>{t("currentIncidents.table.employee")}</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident, index) => (
                <tr
                  key={index}
                  className="clickable-row"
                  onClick={() => navigate(`/incidentview/${incident.id}`)}
                >
                  <td>{incident.type}</td>
                  <td>{new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                  <td>{incident.facility.name}</td>
                  <td>{incident.reported_by.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

export default CurrentIncidents;

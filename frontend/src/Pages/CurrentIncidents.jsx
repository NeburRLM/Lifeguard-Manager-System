// src/pages/CurrentIncidents.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageIncidents.css"; // Reutilizamos los estilos existentes

function CurrentIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        <h4>Incidencias del Día - {new Date().toLocaleDateString("es-ES")}</h4>
      </header>

      <div className="incident-container">
        <h2>Listado de Incidencias de Hoy</h2>

        {loading ? (
          <p>Cargando incidencias...</p>
        ) : incidents.length === 0 ? (
          <p>No hay incidencias registradas para hoy.</p>
        ) : (
          <table className="incident-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Hora</th>
                <th>Facility</th>
                <th>Empleado</th>
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

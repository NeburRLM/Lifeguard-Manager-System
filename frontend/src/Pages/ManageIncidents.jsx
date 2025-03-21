import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageIncidents.css";

function ManageIncidents() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]); // Lista de instalaciones
        const [selectedFacility, setSelectedFacility] = useState(""); // Instalación seleccionada

    useEffect(() => {
        fetch("http://localhost:4000/incidents")
          .then((response) => response.json())
          .then((data) => {
            if (data.length > 0) {
              setIncidents(data);
              setFilteredIncidents(data);
            } else {
              alert("No employees found");
            }
          })
          .catch((error) => console.log("Error fetching incidents:", error));

          fetch("http://localhost:4000/facility") // Obtener todas las instalaciones
                      .then((response) => response.json())
                      .then((data) => setFacilities(data))
                      .catch((error) => console.log("Error fetching facilities:", error));

      }, []);

      // Filtrar incidentes por instalación
          const handleFacilityChange = (e) => {
              const facilityId = e.target.value;
              setSelectedFacility(facilityId);

              if (facilityId === "all") {
                  setFilteredIncidents(incidents);
              } else {
                  fetch(`http://localhost:4000/facility/${facilityId}/incidents`)
                      .then((response) => response.json())
                      .then((data) => setFilteredIncidents(data))
                      .catch((error) => console.log("Error fetching facility incidents:", error));
              }
          };

    return (
          <main className="content">
                <header className="header">
                  <h4>Manage Incidents</h4>
                </header>

                <div className="incident-container">
                  <h2>Incident List</h2>

                    {/* Dropdown para filtrar por instalación */}
                                    <select id="facility-filter"
                                                                    onChange={handleFacilityChange}
                                                                    value={selectedFacility}
                                                                    className="facility-select"
                                                                >
                                        <option value="all">All Facilities</option>
                                        {facilities.map((facility) => (
                                            <option key={facility.id} value={facility.id}>{facility.name}</option>
                                        ))}
                                    </select>

                  <table className="incident-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Facility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map((incident) => (
                                                  <tr
                                                      key={incident.id}
                                                      className="clickable-row"
                                                      onClick={() => navigate(`/incidentview/${incident.id}`)} // Usamos navigate
                                                  >
                                                      <td>{incident.type}</td>
                                                      <td>{new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                                                      <td>{incident.facility.name}</td>
                                                  </tr>
                                              ))}
                    </tbody>
                  </table>
                </div>
              </main>
        );

}

export default ManageIncidents;
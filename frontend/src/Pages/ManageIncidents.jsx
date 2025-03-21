import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageIncidents.css";

function ManageIncidents() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("all");
    const [selectedIncidentType, setSelectedIncidentType] = useState("all");

    useEffect(() => {
        fetch("http://localhost:4000/incidents")
          .then((response) => response.json())
          .then((data) => {
            if (data.length > 0) {
              setIncidents(data);
              setFilteredIncidents(data);
            } else {
              alert("No incidents found");
            }
          })
          .catch((error) => console.log("Error fetching incidents:", error));

        fetch("http://localhost:4000/facility")
          .then((response) => response.json())
          .then((data) => setFacilities(data))
          .catch((error) => console.log("Error fetching facilities:", error));

        fetch("http://localhost:4000/incident-types")
          .then((response) => response.json())
          .then((data) => setIncidentTypes(data))
          .catch((error) => console.log("Error fetching incident types:", error));
    }, []);

    const filterIncidents = useCallback(() => {
        let filtered = incidents;

        if (selectedFacility !== "all") {
            filtered = filtered.filter(incident => incident.facility.id === selectedFacility);
        }

        if (selectedIncidentType !== "all") {
            filtered = filtered.filter(incident => incident.type === selectedIncidentType);
        }

        setFilteredIncidents(filtered);
    }, [incidents, selectedFacility, selectedIncidentType]);

    useEffect(() => {
        filterIncidents();
    }, [filterIncidents]);

    const handleFacilityChange = (e) => {
        setSelectedFacility(e.target.value);
    };

    const handleIncidentTypeChange = (e) => {
        setSelectedIncidentType(e.target.value);
    };

    return (
        <main className="content">
            <header className="header">
                <h4>Manage Incidents</h4>
            </header>

            <div className="incident-container">
                <h2>Incident List</h2>

                {/* Dropdown para filtrar por instalación */}
                <select
                    id="facility-filter"
                    onChange={handleFacilityChange}
                    value={selectedFacility}
                    className="facility-select"
                >
                    <option value="all">All Facilities</option>
                    {facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>{facility.name}</option>
                    ))}
                </select>

                {/* Dropdown para filtrar por tipo de incidente */}
                <select
                    id="incidentType-filter"
                    onChange={handleIncidentTypeChange}
                    value={selectedIncidentType}
                    className="incidentType-select"
                >
                    <option value="all">All Incident Types</option>
                    {incidentTypes.map((incidentType) => (
                        <option key={incidentType.id} value={incidentType.type}>
                            {incidentType.type}
                        </option>
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
                                onClick={() => navigate(`/incidentview/${incident.id}`)}
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
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./ManageIncidents.css";

function ManageIncidents() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("all");
    const [selectedIncidentType, setSelectedIncidentType] = useState("all");

    const [selectedYear, setSelectedYear] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedDay, setSelectedDay] = useState("all");

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

         filtered = filtered.filter(incident => {
                    const incidentDate = new Date(incident.date);
                    return (
                        (selectedYear === "all" || incidentDate.getFullYear().toString() === selectedYear) &&
                        (selectedMonth === "all" || (incidentDate.getMonth() + 1).toString() === selectedMonth) &&
                        (selectedDay === "all" || incidentDate.getDate().toString() === selectedDay)
                    );
                });


        setFilteredIncidents(filtered);
    }, [incidents, selectedFacility, selectedIncidentType, selectedYear, selectedMonth, selectedDay]);

    useEffect(() => {
        filterIncidents();
    }, [filterIncidents]);

    const handleFacilityChange = (e) => {
        setSelectedFacility(e.target.value);
    };

    const handleIncidentTypeChange = (e) => {
        setSelectedIncidentType(e.target.value);
    };

        const handleYearChange = (e) => {
            const value = e.target.value;
            setSelectedYear(value === "" ? "all" : value);
        };

        const handleMonthChange = (e) => {
            const value = e.target.value;
            setSelectedMonth(value === "" ? "all" : value);
        };

        const handleDayChange = (e) => {
            const value = e.target.value;
            setSelectedDay(value === "" ? "all" : value);
        };

    const handleAnalysisClick = () => {
        navigate("/incident-analysis");
    };

const handleGeneratePdf = () => {
    if (filteredIncidents.length === 0) {
        alert("No incidents found for the selected filters.");
        return;
    }

    const doc = new jsPDF();
    const marginTop = 12;   // Margen superior
    const marginBottom = 12;   // Margen inferior
    const pageHeight = doc.internal.pageSize.height;   // Altura de la página

    // Ordenar las incidencias de más antigua a más nueva
    const sortedIncidents = filteredIncidents.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    // Título y fecha de generación
    doc.setFontSize(16);
    doc.text("Incident Report", 14, marginTop);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`, 14, marginTop + 6);

    let yPosition = marginTop + 15; // Posición inicial

    sortedIncidents.forEach((incident, index) => {
        if (yPosition + 60 > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = marginTop;
        }

        if (index > 0) {
            // Línea separadora entre incidentes
            if (yPosition + 10 > pageHeight - marginBottom) {
                doc.addPage();
                yPosition = marginTop;
            }
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(10, yPosition - 5, 200, yPosition - 5);
            yPosition += 5;
        }

        // Encabezado del incidente con fondo gris claro
        if (yPosition + 10 > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = marginTop;
        }
        doc.setFillColor(240, 240, 240);
        doc.rect(10, yPosition - 3, 190, 8, "F");
        doc.setFontSize(14); // Tamaño de fuente más grande
        doc.setFont("helvetica", "normal"); // Fuente normal
        doc.setTextColor(0, 0, 0);
        doc.text(`Incident #${index + 1}`, 14, yPosition + 2);

        // Subrayado manual
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition + 4, 45, yPosition + 4);

        yPosition += 10;

        const incidentDetails = [
            ["Type", incident.type],
            ["Date", new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })],
            ["Description", incident.description],
            ["Facility", incident.facility.name],
            ["Latitude / Longitude", `${incident.latitude}, ${incident.longitude}`]
        ];

        autoTable(doc, {
            startY: yPosition,
            theme: "grid",
            head: [["Field", "Value"]],
            body: incidentDetails,
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 40 },
                1: { cellWidth: "auto" }
            },
            margin: { top: 0, left: 10, right: 10, bottom: 0 },
            didDrawPage: (data) => {
                yPosition = data.cursor.y + 8; // Actualizar yPosition después de dibujar la tabla
            }
        });

        yPosition = doc.lastAutoTable.finalY + 8;

        if (yPosition + 60 > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = marginTop;
        }

        // Sección de la persona afectada
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Affected Person", 14, yPosition);
        yPosition += 6;

        const personDetails = [
            ["First Name", incident.firstName, "Last Name", incident.lastName],
            ["DNI", incident.dni, "Age", incident.age],
            ["Origin City", incident.cityOfOrigin, "Origin Country", incident.countryOfOrigin],
            ["Gender", incident.gender, "Language", incident.language]
        ];

        autoTable(doc, {
            startY: yPosition,
            theme: "grid",
            head: [["Field", "Value", "Field", "Value"]],
            body: personDetails,
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 35 },
                1: { cellWidth: 50 },
                2: { fontStyle: "bold", cellWidth: 35 },
                3: { cellWidth: 50 }
            },
            margin: { top: 0, left: 10, right: 10, bottom: 0 },
            didDrawPage: (data) => {
                yPosition = data.cursor.y + 12; // Actualizar yPosition después de dibujar la tabla
            }
        });

        yPosition = doc.lastAutoTable.finalY + 12;
    });

    // Guardar el PDF
    doc.save("incident_report.pdf");
};






    return (
            <main className="content">
                <header className="header">
                    <h4>Manage Incidents</h4>
                </header>

                <div className="incident-container">
                    <h2>Incident List</h2>
                    <div className="controlsIncidents">
                        {/* Dropdowns para filtrar por instalación y tipo de incidente */}
                        <div className="filter-controls">
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
                        </div>

                        <div className="date-selectors">
                            <div className="date-selector">
                                <label htmlFor="year-select">Year</label>
                                <input
                                    type="number"
                                    id="year-select"
                                    placeholder="Year (e.g., 2022)"
                                    max={new Date().getFullYear()}
                                    onChange={handleYearChange}
                                    value={selectedYear === "all" ? "" : selectedYear}
                                    className="year-select"
                                />
                            </div>

                            <div className="date-selector">
                                <label htmlFor="month-select">Month</label>
                                <select
                                    id="month-select"
                                    onChange={handleMonthChange}
                                    value={selectedMonth}
                                    className="month-select"
                                >
                                    <option value="all">All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="date-selector">
                                <label htmlFor="day-select">Day</label>
                                <select
                                    id="day-select"
                                    onChange={handleDayChange}
                                    value={selectedDay}
                                    className="day-select"
                                >
                                    <option value="all">All Days</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                        </div>








                        <div className="button-group">
                            <button className="generatePDF-button" onClick={handleGeneratePdf}>Generate PDF</button>
                            <button className="analysis-button" onClick={handleAnalysisClick}>Incident Analysis</button>
                        </div>
                    </div>

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
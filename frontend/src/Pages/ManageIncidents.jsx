import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";
import "./ManageIncidents.css";

function ManageIncidents() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("all");
    const [selectedIncidentType, setSelectedIncidentType] = useState("all");
    const { t } = useTranslation();
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
               alert(t("manage-incidents.no-incidents"));
            }
          })
          .catch((error) => console.log(t("manage-incidents.error-fetch-incidents"), error));

        fetch("http://localhost:4000/facility")
          .then((response) => response.json())
          .then((data) => setFacilities(data))
          .catch((error) => console.log(t("manage-incidents.error-fetch-facilities"), error));

        fetch("http://localhost:4000/incident-types")
          .then((response) => response.json())
          .then((data) => setIncidentTypes(data))
          .catch((error) => console.log(t("manage-incidents.error-fetch-incident-types"), error));
    }, [t]);

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
        alert(t("manage-incidents.no-incidents-pdf"));
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
    doc.text(t("manage-incidents.incident-report"), 14, marginTop);
    doc.setFontSize(10);
    doc.text(`${t("manage-incidents.generated-on")} ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`, 14, marginTop + 6);

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
        doc.text(`${t("manage-incidents.incident")} #${index + 1}`, 14, yPosition + 2);

        // Subrayado manual
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition + 4, 45, yPosition + 4);

        yPosition += 10;

        const incidentDetails = [
            [t("manage-incidents.type"), incident.type],
            [t("manage-incidents.date"), new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })],
            [t("manage-incidents.description"), incident.description],
            [t("manage-incidents.facility"), incident.facility.name],
            [t("manage-incidents.coordinates"), `${incident.latitude}, ${incident.longitude}`]
        ];

        autoTable(doc, {
            startY: yPosition,
            theme: "grid",
            head: [[t("manage-incidents.field"), t("manage-incidents.value")]],
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
        doc.text(t("manage-incidents.affected-person"), 14, yPosition);
        yPosition += 6;

        const personDetails = [
            [t("manage-incidents.first-name"), incident.firstName, t("manage-incidents.last-name"), incident.lastName],
            [t("manage-incidents.dni"), incident.dni, t("manage-incidents.age"), incident.age],
            [t("manage-incidents.origin-city"), incident.cityOfOrigin, t("manage-incidents.origin-country"), incident.countryOfOrigin],
            [t("manage-incidents.gender"), incident.gender, t("manage-incidents.language"), incident.language]
        ];

        autoTable(doc, {
            startY: yPosition,
            theme: "grid",
            head: [[t("manage-incidents.field"), t("manage-incidents.value"), t("manage-incidents.field"), t("manage-incidents.value")]],
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
    doc.save(t("manage-incidents.pdf-file-name"));
};






    return (
            <main className="content">
                <header className="header">
                    <h4>{t("manage-incidents.title")}</h4>
                </header>

                <div className="incident-container">
                    <h2>{t("manage-incidents.list-title")}</h2>
                    <div className="controlsIncidents">
                        {/* Dropdowns para filtrar por instalación y tipo de incidente */}
                        <div className="filter-controls">
                            <select
                                id="facility-filter"
                                onChange={handleFacilityChange}
                                value={selectedFacility}
                                className="facility-select"
                            >
                                <option value="all">{t("manage-incidents.select-facility")}</option>
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
                                <option value="all">{t("manage-incidents.select-type")}</option>
                                {incidentTypes.map((incidentType) => (
                                    <option key={incidentType.id} value={incidentType.type}>
                                        {incidentType.type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="date-selectors">
                            <div className="date-selector">
                                <label htmlFor="year-select">{t("manage-incidents.year")}</label>
                                <input
                                    type="number"
                                    id="year-select"
                                    placeholder={t("manage-incidents.year-place")}
                                    max={new Date().getFullYear()}
                                    onChange={handleYearChange}
                                    value={selectedYear === "all" ? "" : selectedYear}
                                    className="year-select"
                                />
                            </div>

                            <div className="date-selector">
                                <label htmlFor="month-select">{t("manage-incidents.month")}</label>
                                <select
                                    id="month-select"
                                    onChange={handleMonthChange}
                                    value={selectedMonth}
                                    className="month-select"
                                >
                                    <option value="all">{t("manage-incidents.months")}</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="date-selector">
                                <label htmlFor="day-select">{t("manage-incidents.day")}</label>
                                <select
                                    id="day-select"
                                    onChange={handleDayChange}
                                    value={selectedDay}
                                    className="day-select"
                                >
                                    <option value="all">{t("manage-incidents.days")}</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        <div className="button-group">
                            <button className="generatePDF-button" onClick={handleGeneratePdf}>{t("manage-incidents.generate-pdf")}</button>
                            <button className="analysis-button" onClick={handleAnalysisClick}>{t("manage-incidents.incident-analysis")}</button>
                        </div>
                    </div>

                    <table className="incident-table">
                        <thead>
                            <tr>
                                <th>{t("manage-incidents.type")}</th>
                                <th>{t("manage-incidents.date")}</th>
                                <th>{t("manage-incidents.facility")}</th>
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
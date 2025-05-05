import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserTie, faBuilding, faCheck, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from 'react-i18next';
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [bossCount, setBossCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0);

  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0 });
  const [incidentCount, setIncidentCount] = useState(0);

  const [currentDate, setCurrentDate] = useState(new Date());

const day = currentDate.getDate();
const month = currentDate.getMonth() + 1;
const year = currentDate.getFullYear();


    useEffect(() => {
      const interval = setInterval(() => {
        const now = new Date();
        // Solo actualizamos si cambia la fecha (día)
        if (now.toDateString() !== currentDate.toDateString()) {
          setCurrentDate(now);
        }
      }, 60 * 1000); // cada minuto

      return () => clearInterval(interval);
    }, [currentDate]);

  const fetchData = async () => {
      try {
        const [employeeRes, bossRes, facilityRes] = await Promise.all([
          fetch("http://localhost:4000/employeeCount").then((res) => res.json()),
          fetch("http://localhost:4000/bossCount").then((res) => res.json()),
          fetch("http://localhost:4000/facilityCount").then((res) => res.json()),
        ]);

        setEmployeeCount(employeeRes.employee || 0);
        setBossCount(bossRes.boss || 0);
        setFacilityCount(facilityRes.facility || 0);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

  useEffect(() => {
    const fetchAttendanceAndIncidents = async () => {
      const today = new Date();
          const todayStr = new Date().toLocaleDateString('sv-SE');
          const month = today.getMonth() + 1;
          const year = today.getFullYear();

      try {
        const employeesRes = await fetch("http://localhost:4000/employees").then(res => res.json());

        let present = 0;
        let absent = 0;

        await Promise.all(
          employeesRes.map(async (employee) => {
            try {
              const attendanceRes = await fetch(
                `http://localhost:4000/attendance/${employee.id}?month=${month}&year=${year}`
              );

              if (!attendanceRes.ok) {
                console.warn(`No attendance data for ${employee.id} (HTTP ${attendanceRes.status})`);
                //absent++; // si quieres considerarlo ausente por no tener datos
                return;
              }

              const attendanceJson = await attendanceRes.json();

              const todayAttendance = attendanceJson.data?.find((a) => {
                const sameDate = a.date === todayStr;
                if (!sameDate) {
                  console.log(`No coincide fecha: ${a.date} !== ${todayStr}`);
                }
                return sameDate;
              });

              if (todayAttendance) {
                console.log(`Empleado ${employee.name} fichó con estado: ${todayAttendance.status}`);
                if (todayAttendance.status === "present") {
                  present++;
                } else if (todayAttendance.status === "absent") {
                  absent++;
                }
              } else {
                console.log(`No se encontró fichaje para ${employee.name} en ${todayStr}`);
                //absent++; // puedes omitir esto si prefieres no contarlo como ausencia
              }
            } catch (err) {
              console.error(`Error fetching attendance for ${employee.id}`, err);
            }
          })
        );

        setAttendanceSummary({ present, absent });

        const incidentsRes = await fetch("http://localhost:4000/incidents/today").then(res => res.json());
        setIncidentCount(incidentsRes.length || 0);

      } catch (error) {
        console.error("Error fetching attendance or incidents:", error);
      }
    };

    fetchData();
    fetchAttendanceAndIncidents();

    const interval = setInterval(() => {
        fetchData();
        fetchAttendanceAndIncidents();
      }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);






return (
    <main className="content">
      <header className="header">
        <h4>{t("dashboard.title")}</h4>
      </header>

      <section className="main-section">
        <div className="stats-container">
          <div className="stat-card">
            <FontAwesomeIcon icon={faUsers} className="stat-icon" />
            <h4>{t("dashboard.employees")}</h4>
            <p className="number">{employeeCount}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faUserTie} className="stat-icon" />
            <h4>{t("dashboard.bosses")}</h4>
            <p className="number">{bossCount}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faBuilding} className="stat-icon" />
            <h4>{t("dashboard.facilities")}</h4>
            <p className="number">{facilityCount}</p>
          </div>
        </div>

        {/* NUEVO BLOQUE */}
        <div className="today-title">
          <p className="today-date">
            📅 <span className="label">{t("dashboard.today")}:</span>{" "}
                        <span className="value">{t("dashboard.day")} {day}</span>,{" "}
                        <span className="value">{t("dashboard.month")} {month}</span>,{" "}
                        <span className="value">{t("dashboard.year")} {year}</span>
          </p>
        </div>
        <div className="stats-container">
          <div
            className="stat-card clickable"
            onClick={() => navigate("/current_attendance")}
          >
            <FontAwesomeIcon icon={faCheck} className="stat-icon" />
            <h4>{t("dashboard.attendance")}</h4>
            <p className="number">{attendanceSummary.present}/{employeeCount} ({attendanceSummary.absent} abs.)</p>
          </div>
          <div
            className="stat-card clickable"
            onClick={() => navigate("/current_incidents")}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className="stat-icon" />
            <h4>{t("dashboard.incidents")}</h4>
            <p className="number">{incidentCount}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;

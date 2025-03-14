import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom"; // Importamos useLocation
import moment from "moment";
import "moment/locale/es";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { jsPDF } from "jspdf";  // Importamos jsPDF
import "./ScheduleView.css";


moment.updateLocale("es", { week: { dow: 1 } });

const localizer = momentLocalizer(moment);

const PayrollView = () => {
  const { id, scheduleId } = useParams();
  const location = useLocation();
  const [facilities, setFacilities] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Extraemos el mes y año de los query params
  const queryParams = new URLSearchParams(location.search);
  const monthFromURL = parseInt(queryParams.get("month"), 10);
  const yearFromURL = parseInt(queryParams.get("year"), 10);

  useEffect(() => {
    if (monthFromURL && yearFromURL) {
      setCurrentMonth(new Date(yearFromURL, monthFromURL - 1, 1));
    }
  }, [monthFromURL, yearFromURL]);

  const fetchEmployeeData = useCallback(() => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);
        const schedule = data.work_schedule.find((ws) => ws.id === scheduleId);
        if (!schedule) return;

        const formattedEvents = schedule.schedules.map((schedule) => ({
          id: schedule.id,
          title: `${moment(schedule.start_time, "HH:mm:ss").format("HH:mm")}h - ${moment(schedule.end_time, "HH:mm:ss").format("HH:mm")}h\n${schedule.facility.name}`,
          start: new Date(`${schedule.date}T${schedule.start_time}`),
          end: new Date(`${schedule.date}T${schedule.end_time}`),
          facility: schedule.facility.id,
        }));
        setEvents(formattedEvents);
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id, scheduleId]);

  const fetchFacilities = () => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.log("Error fetching facilities:", error));
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchFacilities();
  }, [fetchEmployeeData]);

  // Verificamos si el employee está cargado antes de acceder a 'employee.name'
  if (!employee) {
    return <div>Cargando...</div>; // O puedes mostrar algún loader/indicador de carga
  }

  return (
    <div className="schedule-view-container">
      <h2>Horas {moment(currentMonth).format("MMMM YYYY")} - {employee.name}</h2>
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, width: "100%" }}
          date={currentMonth}
          onNavigate={(date) => setCurrentMonth(date)}
          toolbar={true}
          selectable={true}
          eventPropGetter={(event) => ({
            style: { backgroundColor: "#1976D2", color: "white", borderRadius: "5px", padding: "5px" },
          })}
        />
      </div>
    </div>
  );
};
export default PayrollView;

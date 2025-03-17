import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import moment from "moment";
import "moment/locale/es";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./PayrollView.css";

moment.updateLocale("es", { week: { dow: 1 } });

const localizer = momentLocalizer(moment);

const PayrollView = () => {
  const { id, scheduleId } = useParams();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentSchedule, setCurrentSchedule] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const monthFromURL = parseInt(queryParams.get("month"), 10);
  const yearFromURL = parseInt(queryParams.get("year"), 10);

  useEffect(() => {
    if (!isNaN(monthFromURL) && !isNaN(yearFromURL)) {
      setCurrentMonth(new Date(yearFromURL, monthFromURL - 1, 1));
    }
  }, [monthFromURL, yearFromURL]);

  const fetchEmployeeData = useCallback(() => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Employee data:", data);
        setEmployee(data);

        let schedule = data.work_schedule.find((ws) => ws.id === scheduleId);

        if (!schedule) {
          schedule = data.work_schedule.find(
            (ws) =>
              ws.month === (monthFromURL || currentMonth.getMonth() + 1) &&
              ws.year === (yearFromURL || currentMonth.getFullYear())
          );
        }

        if (!schedule) {
          console.log("No se encontró un work_schedule correspondiente.");
          return;
        }

        setCurrentSchedule(schedule);

        const formattedSchedules = schedule.schedules.map((shift) => ({
          id: `schedule-${shift.id}`,
          title: `${moment(shift.start_time, "HH:mm:ss").format("HH:mm")}h - ${moment(shift.end_time, "HH:mm:ss").format("HH:mm")}h\n ${shift.facility.name}`,
          start: new Date(`${shift.date}T${shift.start_time}`),
          end: new Date(`${shift.date}T${shift.end_time}`),
          facility: shift.facility.id,
          type: "schedule",
        }));

        setEvents(formattedSchedules);
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id, scheduleId, monthFromURL, yearFromURL, currentMonth]);

  const fetchAttendanceData = useCallback(() => {
    if (!id || !monthFromURL || !yearFromURL) return;

    fetch(`http://localhost:4000/attendance/${id}?month=${monthFromURL}&year=${yearFromURL}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Attendance data:", data);

        if (data.status !== "success" || !data.data) return;

        const formattedAttendance = data.data.map((attendance) => ({
          id: `attendance-${attendance.id}`,
          title: `${moment(attendance.check_in, "HH:mm:ss").format("HH:mm")}h - ${moment(attendance.check_out, "HH:mm:ss").format("HH:mm")}h\n ${attendance.facility.name}`,
          start: moment(`${attendance.date} ${attendance.check_in}`, "YYYY-MM-DD HH:mm:ss").toDate(),
          end: moment(`${attendance.date} ${attendance.check_out}`, "YYYY-MM-DD HH:mm:ss").toDate(),

          facility: attendance.facility.id,
          type: "attendance",
        }));

        setEvents((prevEvents) => {
          const filteredEvents = prevEvents.filter(event => event.type !== "attendance");
          return [...filteredEvents, ...formattedAttendance];
        });
      })
      .catch((error) => console.log("Error fetching attendance data:", error));
  }, [id, monthFromURL, yearFromURL]);



  useEffect(() => {
    setEvents([]); // Reiniciar eventos para evitar duplicados
    fetchEmployeeData();
    fetchAttendanceData();
  }, [fetchEmployeeData, fetchAttendanceData]);

  if (!employee || !currentSchedule) {
    return <div>Cargando...</div>;
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
          eventPropGetter={(event) => {
            let backgroundColor = "#1976D2"; // Azul por defecto (schedule)

            if (event.type === "attendance") {
              backgroundColor = "#D32F2F"; // Rojo para attendance
            }

            return {
              style: {
                backgroundColor: backgroundColor,
                color: "white",
                borderRadius: "5px",
                padding: "5px",
                border: "1px solid white",
              },
            };
          }}

        />
      </div>
    </div>
  );
};

export default PayrollView;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const ScheduleView = () => {
  const { id, scheduleId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);

        const schedule = data.work_schedule.find((ws) => ws.id === scheduleId);
        if (!schedule) return;

        const selectedDate = new Date(schedule.year, schedule.month - 1, 1);
        setCurrentMonth(selectedDate);

        const formattedEvents = schedule.schedules.map((schedule) => ({
          id: schedule.id,
          title: `${moment(schedule.start_time, "HH:mm:ss").format("HH:mm")}h - ${moment(schedule.end_time, "HH:mm:ss").format("HH:mm")}h\n${schedule.facility.name}`,
          start: new Date(schedule.date + "T" + schedule.start_time),
          end: new Date(schedule.date + "T" + schedule.end_time),
        }));

        setEvents(formattedEvents);
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id, scheduleId]);

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="schedule-view-container">
      <h2>Cuadrante {moment(currentMonth).format("MMMM YYYY")} - {employee.name}</h2>

      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, width: "100%" }}
          date={currentMonth}
          onNavigate={(date) => setCurrentMonth(date)}
          view="month"
          toolbar={false}
          eventPropGetter={(event) => ({
            style: { backgroundColor: "#1976D2", color: "white", borderRadius: "5px", padding: "5px" },
          })}
        />
      </div>
    </div>
  );
};

export default ScheduleView;

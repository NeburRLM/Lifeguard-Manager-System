import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./ScheduleView.css";

const localizer = momentLocalizer(moment);

const ScheduleView = () => {
  const { id, scheduleId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ start: "", end: "", facility: "", date: "" });

  useEffect(() => {
    fetchEmployeeData();
    fetchFacilities();
  }, [id, scheduleId]);

  const fetchEmployeeData = () => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);
        const schedule = data.work_schedule.find((ws) => ws.id === scheduleId);
        if (!schedule) return;

        setCurrentMonth(new Date(schedule.year, schedule.month - 1, 1));

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
  };

  const fetchFacilities = () => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.log("Error fetching facilities:", error));
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      start: moment(event.start).format("HH:mm"),
      end: moment(event.end).format("HH:mm"),
      facility: event.facility,
      date: moment(event.start).format("YYYY-MM-DD"),
    });
    setShowModal(true);
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent(null);
    setFormData({
      start: "",
      end: "",
      facility: "",
      date: moment(start).format("YYYY-MM-DD"),
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.start || !formData.end || !formData.facility || !formData.date) return;

    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent,
        start: `${formData.date}T${formData.start}:00`,
        end: `${formData.date}T${formData.end}:00`,
        facility: formData.facility,
      };

      try {
        const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${selectedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_time: formData.start,
            end_time: formData.end,
            facilityId: formData.facility,
          }),
        });

        if (!response.ok) throw new Error("Error al actualizar el evento");

        setEvents(events.map((ev) => (ev.id === selectedEvent.id ? updatedEvent : ev)));
        setShowModal(false);
        fetchEmployeeData();
      } catch (error) {
        console.error("Error guardando el evento:", error);
      }
    } else {
      try {
        const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${scheduleId}/add_schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formData.date,
            start_time: formData.start,
            end_time: formData.end,
            facilityId: formData.facility,
          }),
        });

        if (!response.ok) throw new Error("Error al agregar el horario");

        const createdSchedule = await response.json();
        const formattedEvent = {
          id: createdSchedule.id,
          title: `${formData.start}h - ${formData.end}h\n${facilities.find(f => f.id === formData.facility)?.name}`,
          start: new Date(`${formData.date}T${formData.start}:00`),
          end: new Date(`${formData.date}T${formData.end}:00`),
          facility: formData.facility,
        };

        setEvents([...events, formattedEvent]);
        setShowModal(false);
        fetchEmployeeData();
      } catch (error) {
        console.error("Error guardando el evento:", error);
      }
    }
  };

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
          toolbar={true}
          selectable={true}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={(event) => ({
            style: { backgroundColor: "#1976D2", color: "white", borderRadius: "5px", padding: "5px" },
          })}
        />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{selectedEvent ? "Editar Evento" : "Crear Nuevo Evento"}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form>
                <label>Hora de inicio:</label>
                <input type="time" name="start" value={formData.start} onChange={handleChange} />

                <label>Hora de fin:</label>
                <input type="time" name="end" value={formData.end} onChange={handleChange} />

                <label>Ubicación:</label>
                <select name="facility" value={formData.facility} onChange={handleChange}>
                  <option value="">Seleccione una ubicación</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </form>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="save-btn" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;

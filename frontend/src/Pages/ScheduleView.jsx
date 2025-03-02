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
  const [facilities, setFacilities] = useState([]);  // Estado para las instalaciones
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ start: "", end: "", facility: "" });

  // Función para obtener los datos del empleado y su horario
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
          facility: schedule.facility.id,  // Usamos el id de la instalación
        }));

        setEvents(formattedEvents);
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  };

  // Obtener las instalaciones disponibles
  const fetchFacilities = () => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.log("Error fetching facilities:", error));
  };

  // Llamar a las funciones al cargar los datos
  useEffect(() => {
    fetchEmployeeData();
    fetchFacilities();
  }, [id, scheduleId]);

  const handleSelectEvent = (event) => {
    console.log("Evento seleccionado:", event); // 👀 Verifica toda la info del evento
    console.log("ID del schedule seleccionado:", event.id); // 🔥 Este es el ID que buscamos

    setSelectedEvent(event);
    setFormData({
      start: moment(event.start).format("HH:mm"),
      end: moment(event.end).format("HH:mm"),
      facility: event.facility,  // Usamos el ID de la instalación aquí también
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!selectedEvent) return;

    const updatedEvent = {
      ...selectedEvent,
      start: moment(selectedEvent.start).format("YYYY-MM-DD") + "T" + formData.start + ":00",
      end: moment(selectedEvent.end).format("YYYY-MM-DD") + "T" + formData.end + ":00",
      facility: formData.facility,
    };

    try {
      const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${selectedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: formData.start,
          end_time: formData.end,
          facilityId: formData.facility, // Enviamos el ID de la instalación
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar el evento");

      // Actualizamos el evento en el frontend
      setEvents(events.map((ev) => (ev.id === selectedEvent.id ? updatedEvent : ev)));
      setShowModal(false);

      // Llamamos a fetchEmployeeData nuevamente para obtener los datos más recientes
      fetchEmployeeData();
    } catch (error) {
      console.error("Error guardando el evento:", error);
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
          eventPropGetter={(event) => ({
            style: { backgroundColor: "#1976D2", color: "white", borderRadius: "5px", padding: "5px" },
          })}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* Modal para editar eventos */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Editar Evento</h3>
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
              <button className="save-btn" onClick={handleSave}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;

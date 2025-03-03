import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import "moment/locale/es";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { jsPDF } from "jspdf";  // Importamos jsPDF
import "./ScheduleView.css";

// Configurar Moment para que la semana empiece en lunes
moment.updateLocale("es", { week: { dow: 1 } });

const localizer = momentLocalizer(moment);

const ScheduleView = () => {
  const { id, scheduleId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [currentView, setCurrentView] = useState("week");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ start: "", end: "", facility: "", date: "" });

  // Definimos la función fetchEmployeeData con useCallback para evitar la advertencia
  const fetchEmployeeData = useCallback(() => {
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
  }, [id, scheduleId]);

  // Llamamos a la función fetchEmployeeData y fetchFacilities al iniciar el componente
  useEffect(() => {
    fetchEmployeeData();
    fetchFacilities();
  }, [fetchEmployeeData]); // Ahora, fetchEmployeeData está en las dependencias, lo cual resuelve la advertencia

  // Función para obtener las instalaciones
  const fetchFacilities = () => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.log("Error fetching facilities:", error));
  };

  // Función para seleccionar un evento
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

  // Función para seleccionar un slot
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

  // Maneja el cambio de valores en el formulario del modal
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Guarda un nuevo evento o actualiza uno existente
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

  // Elimina un evento
  const handleDelete = async () => {
    if (selectedEvent) {
      try {
        const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${scheduleId}/schedule/${selectedEvent.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Error al eliminar el evento");

        setEvents(events.filter((event) => event.id !== selectedEvent.id));
        setShowModal(false);
      } catch (error) {
        console.error("Error eliminando el evento:", error);
      }
    }
  };

  // Genera el PDF con el cuadrante de trabajo
  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startX = 10;
    let startY = 20;  // Ajuste inicial
    const cellWidth = (pageWidth - startX * 2) / 7;
    const cellHeight = 25; // Ligeramente más pequeño

    // **Título principal**
    doc.setFontSize(16); // Tamaño reducido
    doc.setTextColor(40, 40, 40);
    doc.text(`CUADRANTE DE TRABAJO - ${moment(currentMonth).format("MMMM YYYY").toUpperCase()}`, startX, startY);

    // **Nombre del empleado con menor tamaño**
    startY += 8;
    doc.setFontSize(12);
    doc.text(`Empleado: ${employee.name}`, startX, startY);

    startY += 8; // Menos espacio para que todo encaje

    const daysInMonth = moment(currentMonth).daysInMonth();
    const firstDay = (moment(currentMonth).startOf("month").day() + 6) % 7; // Cambiado para empezar el lunes
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    // **Encabezados de la tabla con fuente más pequeña**
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    for (let i = 0; i < 7; i++) {
      doc.text(daysOfWeek[i], startX + cellWidth * i + 2, startY);
    }

    startY += 7; // Espacio justo debajo del encabezado

    let dayCounter = 1;
    let row = 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Reducimos el tamaño de la fuente

    while (dayCounter <= daysInMonth) {
      for (let col = 0; col < 7; col++) {
        if ((row === 0 && col < firstDay) || dayCounter > daysInMonth) {
          doc.rect(startX + cellWidth * col, startY + cellHeight * row, cellWidth, cellHeight);
        } else {
          const date = moment(currentMonth).date(dayCounter).format("YYYY-MM-DD");
          const eventsForDay = events.filter(event => moment(event.start).format("YYYY-MM-DD") === date);
          let textY = startY + cellHeight * row + 6;

          // **Dibuja la celda**
          doc.rect(startX + cellWidth * col, startY + cellHeight * row, cellWidth, cellHeight);

          // **Fecha en negrita pero más pequeña**
          doc.setFont("helvetica", "bold");
          doc.text(`${dayCounter} ${moment(date).format("MMM")}`, startX + cellWidth * col + 2, textY);
          textY += 5;

          // **Eventos del día con fuente más compacta**
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);

          if (eventsForDay.length > 0) {
            eventsForDay.forEach(event => {
              const time = `${moment(event.start).format("HH:mm")} - ${moment(event.end).format("HH:mm")}h`;
              const location = facilities.find(f => f.id === event.facility)?.name || "Desconocida";

              doc.text(location, startX + cellWidth * col + 2, textY);
              textY += 4;
              doc.text(time, startX + cellWidth * col + 2, textY);
              textY += 4;
            });
          } else {
            doc.setTextColor(200, 0, 0);
            doc.text("LIBRE", startX + cellWidth * col + 2, textY);
            doc.setTextColor(0, 0, 0);
          }

          dayCounter++;
        }
      }
      row++;
    }

    doc.save("cuadrante_trabajo.pdf");
  };





  if (!employee) return <div>Loading...</div>;

  return (
    <div className="schedule-view-container">
      <h2>Cuadrante {moment(currentMonth).format("MMMM YYYY")} - {employee.name}</h2>

      <div className="calendar-container">
        <Calendar
          view={currentView}
          onView={setCurrentView}
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, width: "100%" }}
          date={currentMonth}
          onNavigate={(date) => setCurrentMonth(date)}
          toolbar={true}
          selectable={true}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={(event) => ({
            style: { backgroundColor: "#1976D2", color: "white", borderRadius: "5px", padding: "5px" },
          })}
        />
      </div>

      <button onClick={handleDownloadPDF} className="download-pdf-btn">
        Descargar Cuadrante en PDF
      </button>

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
              {selectedEvent && (
                <button className="delete-btn" onClick={handleDelete}>Eliminar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;

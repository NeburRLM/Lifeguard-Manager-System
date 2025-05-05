import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import "moment/locale/es"; // Importamos los idiomas adicionales
import "moment/locale/ca"; // Catalán
import "moment/locale/en-gb"; // Inglés británico
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { jsPDF } from "jspdf";  // Importamos jsPDF
import { useTranslation } from "react-i18next";
import "./ScheduleView.css";

// Configurar Moment para que la semana empiece en lunes
moment.updateLocale("es", { week: { dow: 1 } });


const ScheduleView = () => {
  const { id, scheduleId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [currentView, setCurrentView] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localizer, setLocalizer] = useState(momentLocalizer(moment));
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ start: "", end: "", facility: "", date: "" });
  const { t, i18n } = useTranslation();

  // Función para actualizar el idioma de Moment.js y react-big-calendar
  const updateLocale = useCallback(() => {
      const newLanguage = i18n.language;

      // Actualizar el idioma de Moment.js
      moment.locale(newLanguage); // Cambia el idioma de Moment.js dinámicamente

      // Actualizar el localizador de react-big-calendar
      setLocalizer(momentLocalizer(moment));
    }, [i18n.language]);

    useEffect(() => {
      updateLocale();
    }, [updateLocale]);

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
  // Función para seleccionar un slot (día)
  const handleSelectSlot = ({ start, end }) => {
    // Buscar si el día seleccionado tiene eventos
    const selectedDate = moment(start).format("YYYY-MM-DD");
    const eventsForDay = events.filter(event => moment(event.start).format("YYYY-MM-DD") === selectedDate);

    if (eventsForDay.length > 0) {
      // Si hay eventos en el día, selecciona el primero para editarlo
      const firstEvent = eventsForDay[0];
      setSelectedEvent(firstEvent);
      setFormData({
        start: moment(firstEvent.start).format("HH:mm"),
        end: moment(firstEvent.end).format("HH:mm"),
        facility: firstEvent.facility,
        date: selectedDate,
      });
      setShowModal(true); // Muestra el modal para editar
    } else {
      // Si no hay eventos en el día, configura el formulario para crear uno nuevo
      setSelectedEvent(null);
      setFormData({
        start: "",
        end: "",
        facility: "",
        date: selectedDate,
      });
      setShowModal(true); // Muestra el modal para crear un nuevo evento
    }
  };


  // Maneja el cambio de valores en el formulario del modal
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Guarda un nuevo evento o actualiza uno existente
  const handleSave = async () => {
      if (!formData.start || !formData.end || !formData.facility || !formData.date) return;

      if (selectedEvent) {
        const workSchedule = employee.work_schedule.find(ws => ws.id === scheduleId);
        const updatedEvent = {
          ...selectedEvent,
          start: `${formData.date}T${formData.start}:00`,
          end: `${formData.date}T${formData.end}:00`,
          facility: formData.facility,
        };

         try {
              // Asumiendo que 'selectedEvent.workScheduleId' es el 'workScheduleId' y 'selectedEvent.id' es el 'scheduleId'
              const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${workSchedule.id}/schedule/${selectedEvent.id}`, {
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
    doc.text(`${t("schedule-view.title-pdf", { month: moment(currentMonth).format("MMMM YYYY").toUpperCase(), employeeName: employee.name })}`, startX, startY);

    // **Nombre del empleado con menor tamaño**
    startY += 8;
    doc.setFontSize(12);
    doc.text(`${t("schedule-view.employee-title")} ${employee.name}`, startX, startY);

    startY += 8; // Menos espacio para que todo encaje

    const daysInMonth = moment(currentMonth).daysInMonth();
    const firstDay = (moment(currentMonth).startOf("month").day() + 6) % 7; // Cambiado para empezar el lunes
    const daysOfWeek = [
          t("days.monday"),
          t("days.tuesday"),
          t("days.wednesday"),
          t("days.thursday"),
          t("days.friday"),
          t("days.saturday"),
          t("days.sunday")
        ];

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
            doc.text(t("schedule-view.rest"), startX + cellWidth * col + 2, textY);
            doc.setTextColor(0, 0, 0);
          }

          dayCounter++;
        }
      }
      row++;
    }

    doc.save(t("schedule-view.name"));
  };

const handleDeleteSchedule = async () => {
  if (!employee || !employee.work_schedule) return;

  // Encuentra el 'workSchedule' a partir del 'scheduleId'
  const workSchedule = employee.work_schedule.find(ws => ws.id === scheduleId);

  if (!workSchedule) {
    alert("No se encontró el cuadrante de trabajo.");
    return;
  }
  const confirmDelete = window.confirm(t("schedule-view.confirm-delete"));
      if (!confirmDelete) return;

  try {
    // Eliminar todos los schedules asociados al work schedule
    for (const schedule of workSchedule.schedules) {
      const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${scheduleId}/schedule/${schedule.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar el evento con ID ${schedule.id}`);
      }
    }

    // Luego eliminar el work schedule
    const response = await fetch(`http://localhost:4000/employee/${id}/work_schedule/${scheduleId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al eliminar el cuadrante de trabajo");
    }

    // Si todo es exitoso, actualizamos el estado y cerramos el modal
    alert(t("schedule-view.delete-success"));

    // Redirigir a la página anterior (esto puede ser dinámico según el employeeId)
    window.location.href = `/employeeview/${id}`; // Redirige a la página del empleado
  } catch (error) {
    console.error("Error eliminando el cuadrante:", error);
    alert(t("schedule-view.delete-success"));
  }
};








  if (!employee) return <div>Loading...</div>;

  return (
    <div className="schedule-view-container">
      <h2>
        {t("schedule-view.title", { month: t(`${moment(currentMonth).format("MMMM YYYY").toLowerCase()}`), employeeName: employee.name })}
      </h2>

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
        {t("schedule-view.download-pdf")}
      </button>
       <button onClick={handleDeleteSchedule} className="delete-schedule-btn">
         {t("schedule-view.delete-schedule")}
       </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{selectedEvent ? t("schedule-view.modal.edit-event") : t("schedule-view.modal.create-event")}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form>
                <label>{t("schedule-view.modal.start-time")}</label>
                <input type="time" name="start" value={formData.start} onChange={handleChange} />

                <label>{t("schedule-view.modal.end-time")}</label>
                <input type="time" name="end" value={formData.end} onChange={handleChange} />

                <label>{t("schedule-view.modal.location")}</label>
                <select name="facility" value={formData.facility} onChange={handleChange}>
                  <option value="">{t("schedule-view.modal.select-facility")}</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </form>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>{t("schedule-view.modal.cancel")}</button>
              <button className="save-btn" onClick={handleSave}>{t("schedule-view.modal.save")}</button>
              {selectedEvent && (
                <button className="delet-btn" onClick={handleDelete}>{t("schedule-view.modal.delete")}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;

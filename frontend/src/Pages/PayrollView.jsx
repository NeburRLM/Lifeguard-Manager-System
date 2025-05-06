import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/es"; // Importamos los idiomas adicionales
import "moment/locale/ca"; // Catalán
import "moment/locale/en-gb"; // Inglés británico
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useTranslation } from 'react-i18next';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./PayrollView.css";
import { PDFViewer } from "@react-pdf/renderer";
import PayslipPDF from "./PayslipPDF";

moment.updateLocale("es", { week: { dow: 1 } });

const PayrollView = () => {
  const navigate = useNavigate();
  const { id, scheduleId } = useParams();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localizer, setLocalizer] = useState(momentLocalizer(moment));
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const { payrollId } = useParams();
  const { t, i18n } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const monthFromURL = parseInt(queryParams.get("month"), 10);
  const yearFromURL = parseInt(queryParams.get("year"), 10);

  const validMonth = !isNaN(monthFromURL) && monthFromURL >= 1 && monthFromURL <= 12 ? monthFromURL : new Date().getMonth() + 1;
  const validYear = !isNaN(yearFromURL) && yearFromURL > 1900 ? yearFromURL : new Date().getFullYear();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  const [isRecalcModalOpen, setIsRecalcModalOpen] = useState(false);
  const [editedHours, setEditedHours] = useState("");
  const [defaultWorkedHours, setDefaultWorkedHours] = useState("0");

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

  useEffect(() => {
    setCurrentMonth(new Date(validYear, validMonth - 1, 1));
  }, [validMonth, validYear]);

  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const fetchRoleSalary = useCallback((payrollId) => {
    fetch(`http://localhost:4000/role_salary/${payrollId}`)
      .then((response) => response.json())
      .then((data) => {
        const earnings = data.earnings || [];
        const deductions = data.deductions || [];
        const monthName = capitalize(moment().month(validMonth - 1).format("MMMM"));

        const modifiedEarnings = earnings.map((earning) => {
          if (earning.name.includes("Paga Extra X")) {
            return {
              ...earning,
              name: `Paga Extra ${monthName}`,
            };
          }
          return earning;
        });

        const totalEarned = parseFloat(earnings.reduce((total, earning) => total + parseFloat(earning.amount || 0), 0).toFixed(2));
        const totalDeductions = parseFloat(deductions.reduce((total, deduction) => total + parseFloat(deduction.amount || 0), 0).toFixed(2));
        const netSalary = parseFloat((totalEarned - totalDeductions).toFixed(2));
        setDefaultWorkedHours(data.total_hours || "0");


        setPayroll({
          month: `${monthName}`,
          year: `${validYear}`,
          company: "LIFEGUARD COMPANY, S.L.",
          cif: "B00000000",
          address: "CL SOCO, 0 - 43850 CAMBRILS",
          period: `DEL 01 AL 31 ${monthName} ${validYear}`,
          bankAccount: "ES00-0000-0000**************",
          totalEarned,
          totalDeductions,
          netSalary,
          earnings: modifiedEarnings,
          deductions,
        });
      })
      .catch((error) => console.log("Error fetching role salary data:", error));
  }, [validMonth, validYear]);

  const fetchEmployeeData = useCallback(() => {
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);

        let schedule = data.work_schedule.find((ws) => ws.id === scheduleId);

        if (!schedule) {
          schedule = data.work_schedule.find(
            (ws) => ws.month === validMonth && ws.year === validYear
          );
        }

        if (!schedule) {
          console.log("No se encontró un work_schedule correspondiente.");
          return;
        }

        setCurrentSchedule(schedule);
        fetchRoleSalary(payrollId);

        const formattedSchedules = schedule.schedules.map((shift) => ({
          id: `schedule-${shift.id}`,
          title: `${moment(shift.start_time, "HH:mm:ss").format("HH:mm")}h - ${moment(shift.end_time, "HH:mm:ss").format("HH:mm")}h\n ${shift.facility.name}`,
          start: new Date(`${shift.date}T${shift.start_time}`),
          end: new Date(`${shift.date}T${shift.end_time}`),
          facility: shift.facility.id,
          type: "schedule",
        }));

        setEvents(formattedSchedules); // Inicializamos los eventos con el horario
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id, scheduleId, validMonth, validYear, payrollId, fetchRoleSalary]);

  const fetchAttendanceData = useCallback(() => {
    if (!id || !validMonth || !validYear) return;

    fetch(`http://localhost:4000/attendance/${id}?month=${validMonth}&year=${validYear}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== "success" || !data.data) return;

        const formattedAttendance = data.data.map((attendance) => ({
          id: `attendance-${attendance.id}`,
          title: `${moment(attendance.check_in, "HH:mm:ss").format("HH:mm")}h - ${moment(attendance.check_out, "HH:mm:ss").format("HH:mm")}h\n ${attendance.facility.name}`,
          start: moment(`${attendance.date} ${attendance.check_in}`, "YYYY-MM-DD HH:mm:ss").toDate(),
          end: moment(`${attendance.date} ${attendance.check_out}`, "YYYY-MM-DD HH:mm:ss").toDate(),
          facility: attendance.facility.id,
          type: "attendance",
          fullData: attendance,
        }));

        // Actualizamos eventos al mismo tiempo con los eventos de "attendance"
        setEvents((prevEvents) => {
          const filteredEvents = prevEvents.filter((event) => event.type !== "attendance");
          return [...filteredEvents, ...formattedAttendance];
        });
      })
      .catch((error) => console.log("Error fetching attendance data:", error));
  }, [id, validMonth, validYear]);

  useEffect(() => {
    setEvents([]); // Limpiamos los eventos antes de empezar a cargar
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  useEffect(() => {
    if (currentSchedule) {
      fetchAttendanceData();
    }
  }, [currentSchedule, fetchAttendanceData]);

  const handleDeletePayroll = () => {
      if (!payrollId) {
        alert(t("payroll-view.alert-id"));
        return;
      }

      const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta nómina?");
      if (!confirmDelete) return;

      fetch(`http://localhost:4000/payroll/${payrollId}`, { method: "DELETE" })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(`${t("payroll-view.error-delete")} ${data.error}`);

          } else {
            alert(t("payroll-view.delete-ok"));
            navigate(-1); // Vuelve a la página anterior
          }
        })
        .catch((error) => console.log("Error al eliminar la nómina:", error));
    };


  const handleSelectDate = (slotInfo) => {
    const selectedDate = moment(slotInfo.start).format("YYYY-MM-DD");
    const dayEvents = events.filter(event =>
      moment(event.start).format("YYYY-MM-DD") === selectedDate
    );

    setSelectedDateEvents(dayEvents);
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
  };

   const handleOpenRecalculateModal = () => {
     setEditedHours(parseFloat(defaultWorkedHours).toFixed(2));
     setIsRecalcModalOpen(true);
   };


   const handleConfirmRecalculate = async () => {
     if (!id || isNaN(parseFloat(editedHours))) {
       alert(t("payroll-view.error-number"));
       return;
     }

     try {
       const response = await fetch(`http://localhost:4000/payroll/recalculate/${id}`, {
         method: "PUT",
         headers: {
           "Content-Type": "application/json"
         },
         body: JSON.stringify({
           month: validMonth,
           year: validYear,
           employee_id: id, // Asegúrate de enviar el ID del empleado
           total_hours_from_user: parseFloat(editedHours) // Asegúrate de usar el nombre correcto
         })
       });

       const data = await response.json();

       if (response.ok) {
         alert(t("payroll-view.recalculate-ok"));
         fetchRoleSalary(payrollId);
         fetchEmployeeData();
         fetchAttendanceData();
       } else {
         alert(data.message || t("payroll-view.recalculate-error"));
       }

       setIsRecalcModalOpen(false);
     } catch (error) {
       console.error("Error:", error);
       alert(t("payroll-view.error-server"));
     }
   };




  if (!employee || !currentSchedule || !payroll) {
    return <div>{t("payroll-view.loading")}</div>;
  }

  return (
    <div className="schedule-view-container" style={{ minHeight: "100vh", overflowY: "auto" }}>
      <button className="deletee-btn" onClick={handleDeletePayroll}>{t("payroll-view.delete-payroll")}</button>
      <h2>{t("payroll-view.title")} {moment(currentMonth).format("MMMM YYYY")} - {employee.name}</h2>
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
          onSelectEvent={handleSelectDate}
          onSelectSlot={handleSelectDate}
          selectable={true}
          eventPropGetter={(event) => {
            let backgroundColor = "#1976D2";
            if (event.type === "attendance") {
              backgroundColor = "#D32F2F";
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

        {isModalOpen && (
          <div className="custom-modalP">
            <div className="modal-contentP">
              <h3>🗓️ {t("payroll-view.day-details")}</h3>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((ev) => {
                  const isAttendance = ev.type === "attendance";
                  const data = ev.fullData || {};
                  let statusText = "";
                  let statusColor = "#2196F3"; // Azul por defecto

                  switch (data.status) {
                    case "absent":
                      statusText = `❌ ${t("payroll-view.status.absent")}`;
                      statusColor = "#D32F2F";
                      break;
                    case "missing_check_out":
                      statusText = `⚠️ ${t("payroll-view.status.missing-check-out")}`;
                      statusColor = "#FFA000";
                      break;
                    case "missing":
                      statusText = `❗ ${t("payroll-view.status.missing")}`;
                      statusColor = "#E53935";
                      break;
                    default:
                      statusText = `✔️ ${t("payroll-view.status.present")}`;
                      statusColor = "#4CAF50";
                  }

                  return (
                    <div key={ev.id} className="event-detail-card">
                      <p><strong>📍 {t("payroll-view.type")}</strong> {isAttendance ? t("payroll-view.attendance") : t("payroll-view.scheduled-shift")}</p>
                      <p><strong>🏢 {t("payroll-view.location")}</strong> {ev.title.split("\n")[1]}</p>
                      <p><strong>🕒 {t("payroll-view.schedule")}</strong> {moment(ev.start).format("HH:mm")} - {moment(ev.end).format("HH:mm")}</p>
                      <p><strong>📅 {t("payroll-view.date")}</strong> {moment(ev.start).format("DD/MM/YYYY")}</p>

                      {isAttendance && (
                        <div className="attendance-info">
                          <p><strong>📊 {t("payroll-view.status.title")}</strong> <span style={{ color: statusColor }}>{statusText}</span></p>

                          {data.status === "absent" && (
                            <>
                              <p><strong>📄 {t("payroll-view.justified")}</strong> {data.justified ? t("payroll-view.yes") : t("payroll-view.no")}</p>
                              {data.absence_reason && <p><strong>✏️ {t("payroll-view.reason")}</strong> {data.absence_reason}</p>}
                              {data.justification_url && (
                                <div className="pdf-link-container">
                                  <a href={data.justification_url} target="_blank" rel="noopener noreferrer">
                                    📎 {t("payroll-view.see-justification")}
                                  </a>
                                </div>
                              )}
                            </>
                          )}

                          {data.note_in && <p><strong>📝 {t("payroll-view.note-in")}</strong> {data.note_in}</p>}
                          {data.note_out && <p><strong>📝 {t("payroll-view.note-out")}</strong> {data.note_out}</p>}
                        </div>
                      )}
                      <hr />
                    </div>
                  );
                })
              ) : (
                <p>{t("payroll-view.no-events")}</p>
              )}
              <button onClick={closeModal}>{t("payroll-view.close")}</button>
            </div>
          </div>
        )}

        {isRecalcModalOpen && (
          <div className="custom-modalP">
            <div className="modal-contentP">
              <h3>🧮 {t("payroll-view.recalculate-payroll")}</h3>
              <p>{t("payroll-view.input-hours")}</p>
              <input
                type="number"
                value={editedHours}
                step="0.01"
                onChange={(e) => setEditedHours(e.target.value)}
                style={{ width: "100%", padding: "10px", margin: "10px 0" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setIsRecalcModalOpen(false)}>{t("payroll-view.cancel")}</button>
                <button onClick={handleConfirmRecalculate}>{t("payroll-view.confirm")}</button>
              </div>
            </div>
          </div>
        )}





      </div>

      <h2 className="payroll-title">{t("payroll-view.payroll-of")} {employee.name} - {payroll.month} {payroll.year}</h2>
     <button
       onClick={handleOpenRecalculateModal}
       style={{ marginBottom: "1rem", padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px" }}
     >
       {t("payroll-view.recalculate-payroll")}
     </button>


      <div style={{ height: "800px", overflowY: "auto" }}>
        <PDFViewer width="100%" height="100%">
          <PayslipPDF key={JSON.stringify(payroll)} employee={employee} payroll={payroll} />
        </PDFViewer>
      </div>

    </div>
  );
};

export default PayrollView;

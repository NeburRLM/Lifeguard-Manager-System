import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import moment from "moment";
import "moment/locale/es";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./PayrollView.css";
import { PDFViewer } from "@react-pdf/renderer";
import PayslipPDF from "./PayslipPDF";

moment.updateLocale("es", { week: { dow: 1 } });

const localizer = momentLocalizer(moment);

const PayrollView = () => {
  const { id, scheduleId } = useParams();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const { payrollId } = useParams();

  const queryParams = new URLSearchParams(location.search);
  const monthFromURL = parseInt(queryParams.get("month"), 10);
  const yearFromURL = parseInt(queryParams.get("year"), 10);

  const validMonth = !isNaN(monthFromURL) && monthFromURL >= 1 && monthFromURL <= 12 ? monthFromURL : new Date().getMonth() + 1;
  const validYear = !isNaN(yearFromURL) && yearFromURL > 1900 ? yearFromURL : new Date().getFullYear();

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
    fetchAttendanceData();
  }, [fetchEmployeeData, fetchAttendanceData]);

  if (!employee || !currentSchedule || !payroll) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="schedule-view-container" style={{ minHeight: "100vh", overflowY: "auto" }}>
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
      </div>

      <h2 className="payroll-title">Nómina de {employee.name} - {payroll.month} {payroll.year}</h2>

      <div style={{ height: "800px", overflowY: "auto" }}>
        <PDFViewer width="100%" height="100%">
          <PayslipPDF employee={employee} payroll={payroll} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PayrollView;

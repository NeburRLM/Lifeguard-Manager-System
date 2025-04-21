import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Modal,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function CurrentAttendance() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const [todayStr, setTodayStr] = useState(new Date().toLocaleDateString('sv-SE'));
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const openModal = (url) => {
    setPdfUrl(url);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setPdfUrl("");
  };

  useEffect(() => {
    const fetchEmployeesWithAttendance = async () => {
      try {
        const employeesRes = await fetch("http://localhost:4000/employees").then(res => res.json());
        const data = [];

        await Promise.all(
          employeesRes.map(async (emp) => {
            try {
              // 1. Verificar si tiene schedule para hoy
              const empDetailRes = await fetch(`http://localhost:4000/employee/${emp.id}`);
              const empDetail = await empDetailRes.json();

              let hasScheduleToday = false;
              let todaySchedule = null;

              empDetail.work_schedule?.forEach(ws => {
                ws.schedules?.forEach(schedule => {
                  if (schedule.date === todayStr) {
                    hasScheduleToday = true;
                    todaySchedule = schedule;
                  }
                });
              });

              let status = "rest"; // Por defecto, descanso si no tiene horario

              if (hasScheduleToday) {
                // 2. Tiene horario, revisar asistencia
                const attendanceRes = await fetch(`http://localhost:4000/attendance/${emp.id}?month=${month}&year=${year}`);
                const attendance = await attendanceRes.json();
                const todayRecord = attendance.data?.find(a => a.date === todayStr);

                if (!todayRecord) {
                  status = "unknown"; // Tiene horario, pero no ha fichado
                } else if (todayRecord.status === "absent") {
                  status = "absent";
                } else if (todayRecord.check_in) {
                  status = "present";
                } else {
                  status = "unknown";
                }

                data.push({
                  ...emp,
                  status,
                  entryTime: todayRecord?.check_in || null,
                  exitTime: todayRecord?.check_out || null,
                  facility: todayRecord?.facility?.name || todaySchedule?.facilityName || null,
                  justification: todayRecord?.justification_url || null,
                  absenceReason: todayRecord?.absence_reason || null,
                  noteIn: todayRecord?.note_in || "",
                  noteOut: todayRecord?.note_out || "",
                });
              } else {
                // 3. No tiene horario → descanso
                data.push({
                  ...emp,
                  status: "rest",
                  entryTime: null,
                  exitTime: null,
                  facility: null,
                  justification: null,
                  absenceReason: null,
                  noteIn: "",
                  noteOut: "",
                });
              }
            } catch (err) {
              console.error(`Error fetching data for ${emp.id}:`, err);
              data.push({ ...emp, status: "unknown" });
            }
          })
        );

        setEmployees(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading attendance detail", err);
        setLoading(false);
      }
    };

    fetchEmployeesWithAttendance();

    // 🔁 Revisión cada minuto por si cambia la fecha
    const interval = setInterval(() => {
        fetchEmployeesWithAttendance();  // Recarga los datos de los empleados cada minuto
      }, 60 * 1000); // cada minuto

      // Llamada inicial para cargar los datos cuando se monta el componente
      fetchEmployeesWithAttendance();

      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(interval);
  }, [todayStr, month, year]);

  const getStatusChip = (status) => {
    const chipProps = {
      present: { label: "Presente", color: "success" },
      absent: { label: "Ausente", color: "error" },
      unknown: { label: "Sin registro", color: "default" },
      rest: { label: "Descanso", color: "info" },
    };

    const props = chipProps[status] || chipProps.unknown;

    return <Chip label={props.label} color={props.color} />;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Asistencia del Día - {new Date(todayStr).toLocaleDateString('es-ES')}
      </Typography>

      {loading ? (
        <Typography>Cargando información...</Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Detalles</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{getStatusChip(emp.status)}</TableCell>
                    <TableCell>
                      {emp.status === "rest" ? (
                        <Typography variant="body2" color="text.secondary">
                        No tiene turno asignado hoy.
                        </Typography>
                      ) : emp.status === "present" ? (
                        <>
                          <Typography variant="body2"><strong>Entrada:</strong> {emp.entryTime || "N/A"}</Typography>
                          <Typography variant="body2"><strong>Salida:</strong> {emp.exitTime || "N/A"}</Typography>
                          <Typography variant="body2"><strong>Ubicación:</strong> {emp.facility || "N/A"}</Typography>
                          {emp.noteIn && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Nota entrada:</strong> {emp.noteIn}
                                </Typography>
                              )}
                              {emp.noteOut && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Nota salida:</strong> {emp.noteOut}
                                </Typography>
                              )}

                        </>
                      ) : emp.status === "absent" ? (
                        <>
                              {emp.absenceReason && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Motivo:</strong> {emp.absenceReason}
                                </Typography>
                              )}
                        {emp.justification ? (
                          <Button variant="outlined" size="small" onClick={() => openModal(emp.justification)}>
                            Ver Justificante
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin justificante
                          </Typography>
                        )}
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No hay información
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Modal para justificante */}
          <Modal
            open={modalVisible}
            onClose={closeModal}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "80%",
                height: "80%",
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 2,
                borderRadius: 2,
                outline: "none",
              }}
            >
              <IconButton
                onClick={closeModal}
                sx={{ position: "absolute", top: 8, right: 8 }}
              >
                <CloseIcon />
              </IconButton>
              <iframe
                src={pdfUrl}
                title="Justificante PDF"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </Box>
          </Modal>
        </>
      )}
    </Box>
  );
}

export default CurrentAttendance;

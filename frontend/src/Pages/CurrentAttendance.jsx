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

  const [searchTerm, setSearchTerm] = useState("");
  const normalizeString = (str) =>
    str ? str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    normalizeString(employee.name).includes(normalizeString(searchTerm)) ||
    normalizeString(employee.id).includes(normalizeString(searchTerm))
  );


  useEffect(() => {
    const fetchEmployeesWithAttendance = async () => {
      try {
        const employeesRes = await fetch("http://localhost:4000/employees").then(res => res.json());
        const data = [];

        await Promise.all(
          employeesRes.map(async (emp) => {
            try {
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

              let status = "rest";

              if (hasScheduleToday) {
                const attendanceRes = await fetch(`http://localhost:4000/attendance/${emp.id}?month=${month}&year=${year}`);
                const attendance = await attendanceRes.json();
                const todayRecord = attendance.data?.find(a => a.date === todayStr);

                if (!todayRecord) {
                  status = "unknown";
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

        // Orden por estado y hora de entrada descendente para "present"
        data.sort((a, b) => {
          const statusOrder = {
            unknown: 0,
            absent: 1,
            present: 2,
            rest: 3
          };

          const aOrder = statusOrder[a.status];
          const bOrder = statusOrder[b.status];

          if (aOrder !== bOrder) return aOrder - bOrder;

          if (a.status === "present" && b.status === "present") {
            return new Date(b.entryTime) - new Date(a.entryTime);
          }

          return 0;
        });

        setEmployees(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading attendance detail", err);
        setLoading(false);
      }
    };

    fetchEmployeesWithAttendance();
    const interval = setInterval(fetchEmployeesWithAttendance, 60 * 1000);
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
    <Box sx={{ p: 4, maxHeight: '90vh', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Asistencia del Día - {new Date(todayStr).toLocaleDateString('es-ES')}
      </Typography>

      {loading ? (
        <Typography>Cargando información...</Typography>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <input
              type="text"
              placeholder="Buscar por nombre o DNI"
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "16px"
              }}
            />
          </Box>

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
                {["unknown", "absent", "present", "rest"].map((group) => {
                  const groupEmployees = filteredEmployees.filter((e) => e.status === group);
                  if (groupEmployees.length === 0) return null;

                  const groupLabel = {
                    unknown: "🔸 Sin registro (No han fichado)",
                    absent: "🔴 Ausentes",
                    present: "🟢 Presentes (ordenado por llegada)",
                    rest: "🟦 Descanso"
                  }[group];

                  return (
                    <React.Fragment key={group}>
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          sx={{
                            borderTop: "4px solid black",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold", py: 1 }}>
                            {groupLabel}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {groupEmployees.map((emp) => (
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
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

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

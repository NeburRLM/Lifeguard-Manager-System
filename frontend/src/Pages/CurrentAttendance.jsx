import React, { useEffect, useState } from "react";

function CurrentAttendance() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
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
              const attendanceRes = await fetch(`http://localhost:4000/attendance/${emp.id}?month=${month}&year=${year}`);
              if (!attendanceRes.ok) {
                data.push({ ...emp, status: "unknown" });
                return;
              }

              const attendance = await attendanceRes.json();
              const todayRecord = attendance.data?.find(a => a.date === todayStr);

              data.push({
                ...emp,
                status: todayRecord?.status || "unknown",
                entryTime: todayRecord?.check_in || null,
                exitTime: todayRecord?.check_out || null,
                facility: todayRecord?.facility.name || null,
                justification: todayRecord?.justification || null,
              });
            } catch (err) {
              console.error(`Error fetching attendance for ${emp.id}:`, err);
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
  }, [month, year, todayStr]);

  return (
    <div style={{ padding: "30px" }}>
      <h2>Detalle de Fichajes de Hoy</h2>
      {loading ? <p>Cargando...</p> : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "10px" }}>Nombre</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "10px" }}>Estado</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "10px" }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ padding: "10px" }}>{emp.name}</td>
                  <td style={{ padding: "10px" }}>
                    {emp.status === "present" && <span style={{ color: "green" }}>Presente</span>}
                    {emp.status === "absent" && <span style={{ color: "red" }}>Ausente</span>}
                    {emp.status === "unknown" && <span style={{ color: "gray" }}>Sin registro</span>}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {emp.status === "present" && (
                      <>
                        Entrada: {emp.entryTime || "N/A"} <br />
                        Salida: {emp.exitTime || "N/A"} <br />
                        Facility: {emp.facility || "N/A"}
                      </>
                    )}
                    {emp.status === "absent" && emp.justification ? (
                      <button onClick={() => openModal(emp.justification)}>Ver Justificante</button>
                    ) : emp.status === "absent" ? (
                      <span style={{ color: "gray" }}>Sin justificante</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal para ver PDF */}
          {modalVisible && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center"
            }}>
              <div style={{ background: "white", padding: 20, width: "80%", height: "80%", position: "relative" }}>
                <button onClick={closeModal} style={{ position: "absolute", top: 10, right: 10 }}>Cerrar</button>
                <iframe src={pdfUrl} title="Justificante PDF" style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CurrentAttendance;

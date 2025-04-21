// src/pages/CurrentIncidents.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";

function CurrentIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("sv-SE");

    fetch(`http://localhost:4000/incidents/today`)
      .then(res => res.json())
      .then(data => {
        setIncidents(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching incidents:", err);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Incidencias del Día - {new Date().toLocaleDateString("es-ES")}
      </Typography>

      {loading ? (
        <Typography>Cargando incidencias...</Typography>
      ) : incidents.length === 0 ? (
        <Typography>No hay incidencias registradas para hoy.</Typography>
      ) : (
        incidents.map((incident, idx) => (
          <Paper key={idx} sx={{ p: 2, mb: 2 }}>
            <Typography><strong>Empleado:</strong> {incident.employee?.name || "Desconocido"}</Typography>
            <Typography><strong>Tipo:</strong> {incident.type}</Typography>
            <Typography><strong>Descripción:</strong> {incident.description}</Typography>
            <Typography><strong>Hora:</strong> {incident.time || "N/A"}</Typography>
          </Paper>
        ))
      )}
    </Box>
  );
}

export default CurrentIncidents;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./IncidentView.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Container,
  Divider,
} from "@mui/material";

const customIcon = new L.Icon({
  iconUrl: "/icon.svg",
  iconSize: [35, 35],
  className: "leaflet-venue-icon",
});

function IncidentView() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/incidents/${id}`)
            .then((response) => response.json())
            .then((data) => setIncident(data))
            .catch((error) => console.log("Error fetching incident:", error));
    }, [id]);

    if (!incident) {
        return <div className="loading">Loading...</div>;
    }

     return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Incident Details
          </Typography>

          <Box mb={4} borderRadius={2} overflow="hidden" sx={{ boxShadow: 3 }}>
            <MapContainer
              center={[incident.latitude, incident.longitude]}
              zoom={17}
              style={{ height: 400, width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[incident.latitude, incident.longitude]} icon={customIcon}>
                <Popup>{incident.facility.name}</Popup>
              </Marker>
            </MapContainer>
          </Box>

          <Card sx={{ mb: 4, p: 2 }}>
            <CardContent>
              <Typography variant="h6">Incident Information</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography><strong>Type:</strong> {incident.type}</Typography>
              <Typography><strong>Description:</strong> {incident.description}</Typography>
              <Typography><strong>Date:</strong> {new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</Typography>
              <Typography><strong>Facility:</strong> {incident.facility.name}</Typography>
              <Typography><strong>Location:</strong> {incident.facility.location}</Typography>
            </CardContent>
          </Card>

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Victim and Reporter Details
          </Typography>
          <Grid container spacing={10} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: '100%', borderLeft: '6px solid #9e9e9e' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight="bold">🧍 Victim Info</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography><strong>Name:</strong> {incident.firstName} {incident.lastName}</Typography>
                  <Typography><strong>Dni:</strong> {incident.dni}</Typography>
                  <Typography><strong>Age:</strong> {incident.age}</Typography>
                  <Typography><strong>City:</strong> {incident.cityOfOrigin}</Typography>
                  <Typography><strong>Country:</strong> {incident.countryOfOrigin}</Typography>
                  <Typography><strong>Gender:</strong> {incident.gender}</Typography>
                  <Typography><strong>Language:</strong> {incident.language}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: '100%', borderLeft: '6px solid #9e9e9e' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight="bold">📋 Reported By</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={incident.reported_by.image || "/default-avatar.jpg"}
                      alt={incident.reported_by.name}
                      sx={{ width: 64, height: 64, border: '2px solid #1976d2' }}
                    />
                    <Box>
                      <Typography><strong>Name:</strong> {incident.reported_by.name}</Typography>
                      <Typography><strong>Dni:</strong> {incident.reported_by.id}</Typography>
                      <Typography><strong>Phone:</strong> {incident.reported_by.phone_number}</Typography>
                      <Typography><strong>Role:</strong> {incident.reported_by.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      );
    }

    export default IncidentView;
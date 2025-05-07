import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    useEffect(() => {
        fetch(`http://localhost:4000/incidents/${id}`)
            .then((response) => response.json())
            .then((data) => setIncident(data))
            .catch((error) => console.log("Error fetching incident:", error));
    }, [id]);

    if (!incident) {
        return <div className="loading">{t("incident-view.loading")}</div>;
    }

     return (
        <Box sx={{ height: '100vh', overflowY: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            {t("incident-view.title")}
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
              <Typography variant="h6">{t("incident-view.title-incident")}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography><strong>{t("incident-view.type")}</strong> {incident.type}</Typography>
              <Typography><strong>{t("incident-view.description")}</strong> {incident.description}</Typography>
              <Typography><strong>{t("incident-view.date")}</strong> {new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</Typography>
              <Typography><strong>{t("incident-view.facility")}</strong> {incident.facility.name}</Typography>
              <Typography><strong>{t("incident-view.location")}</strong> {incident.facility.location}</Typography>
            </CardContent>
          </Card>

          <Typography variant="h5" fontWeight={600} gutterBottom>
            {t("incident-view.title-info")}
          </Typography>
          <Grid container spacing={10} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderLeft: '6px solid #9e9e9e' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight="bold">🧍 {t("incident-view.victim-info")}</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography><strong>{t("incident-view.name")}</strong> {incident.firstName} {incident.lastName}</Typography>
                  <Typography><strong>{t("incident-view.dni")}</strong> {incident.dni}</Typography>
                  <Typography><strong>{t("incident-view.age")}</strong> {incident.age}</Typography>
                  <Typography><strong>{t("incident-view.origin-city")}</strong> {incident.cityOfOrigin}</Typography>
                  <Typography><strong>{t("incident-view.origin-country")}</strong> {incident.countryOfOrigin}</Typography>
                  <Typography><strong>{t("incident-view.gender")}</strong> {incident.gender}</Typography>
                  <Typography><strong>{t("incident-view.language")}</strong> {incident.language}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: '90%', borderLeft: '6px solid #9e9e9e' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight="bold">📋 {t("incident-view.reported-by")}</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={incident.reported_by.image || "/default-avatar.jpg"}
                      alt={incident.reported_by.name}
                      sx={{ width: 64, height: 64, border: '2px solid #1976d2' }}
                    />
                    <Box>
                      <Typography><strong>{t("incident-view.name")}</strong> {incident.reported_by.name}</Typography>
                      <Typography><strong>{t("incident-view.dni")}</strong> {incident.reported_by.id}</Typography>
                      <Typography><strong>{t("incident-view.phone")}</strong> {incident.reported_by.phone_number}</Typography>
                      <Typography>
                        <strong>{t("incident-view.role")}</strong> {t(`roles.${incident.reported_by.role}`, incident.reported_by.role)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
        </Box>
      );
    }

    export default IncidentView;
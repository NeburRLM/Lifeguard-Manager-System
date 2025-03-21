import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./IncidentView.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

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
        <div className="incident-details">
            <h2>Incident Details</h2>
            <MapContainer center={[incident.facility.latitude, incident.facility.longitude]} zoom={17} className="map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[incident.facility.latitude, incident.facility.longitude]} icon={customIcon}>
                    <Popup>{incident.facility.name}</Popup>
                </Marker>
            </MapContainer>
            <div className="incident-info">
                <p><strong>Type:</strong> {incident.type}</p>
                <p><strong>Description:</strong> {incident.description}</p>
                <p><strong>Date:</strong> {new Date(incident.date).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p>
                <p><strong>Facility:</strong> {incident.facility.name}</p>
                <p><strong>Location:</strong> {incident.facility.location}</p>

                <h3>Reported By</h3>
                <div className="reported-by">
                    <img
                        src={incident.reported_by.image ? incident.reported_by.image : "/default-avatar.jpg"}
                        alt={incident.reported_by.name}
                        className="profile-imageIncident"
                    />
                    <div className="reporter-info">
                        <p><strong>Name:</strong> {incident.reported_by.name}</p>
                        <p><strong>Dni:</strong> {incident.reported_by.id}</p>
                        <p><strong>Phone:</strong> {incident.reported_by.phone_number}</p>
                        <p><strong>Role:</strong> {incident.reported_by.role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IncidentView;
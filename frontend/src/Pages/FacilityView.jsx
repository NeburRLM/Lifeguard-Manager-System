import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaSignOutAlt } from "react-icons/fa";
import "./FacilityView.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Configuración del ícono de Leaflet
const customIcon = new L.Icon({
  iconUrl: "/icon.svg", // Asegúrate de tener el archivo de ícono
  iconAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: [35, 35],
  className: "leaflet-venue-icon",
});

const FacilityView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [user, setUser] = useState(null);

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/");
  };

  const fetchData = () => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  };

  useEffect(() => {
    fetchData();
    const fetchFacility = async () => {
      try {
        const response = await fetch(`http://localhost:4000/facility/${id}`);
        const data = await response.json();
        setFacility(data);

        // Obtenemos las coordenadas desde el objeto "facility" si están presentes
        if (data.latitude && data.longitude) {
          setCoordinates([data.latitude, data.longitude]);
        }
      } catch (error) {
        console.error("Error fetching facility data:", error);
      }
    };

    fetchFacility();
  }, [id]);

  if (!facility) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>

        {user && (
          <div className="user-profile">
            <img
              src={user.image || "/default-avatar.jpg"}
              alt={user.name}
              className="profile-image"
            />
            <p className="user-name">{user.name}</p>
          </div>
        )}

        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/facilities">Manage Facilities</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button className="logout-btn" onClick={signOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="content-map">
        <div className="facility-view">
          <aside className="facility-map">
            {coordinates ? (
              <MapContainer
                center={coordinates}
                zoom={15}
                className="map"
                style={{ height: "600px", width: "100%" }} // Ajustamos el estilo aquí también
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={coordinates} icon={customIcon}>
                  <Popup>{facility.name}</Popup>
                </Marker>
              </MapContainer>
            ) : (
              <p>Cargando mapa...</p>
            )}
          </aside>

          <main className="facility-details">
            <h2>{facility.name}</h2>
            <p><strong>Ubicación:</strong> {facility.location}</p>
            <p><strong>Tipo:</strong> {facility.facility_type}</p>
            {coordinates && (
              <>
                <p><strong>Latitud:</strong> {coordinates[0]}</p>
                <p><strong>Longitud:</strong> {coordinates[1]}</p>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FacilityView;
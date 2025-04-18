import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "./FacilityView.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const customIcon = new L.Icon({
  iconUrl: "/icon.svg",
  iconSize: [35, 35],
  className: "leaflet-venue-icon",
});

const FacilityView = () => {
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedFacility, setEditedFacility] = useState({});
  const [facilitiesTypes, setFacilitiesTypes] = useState([]);
  const [fetchError, setFetchError] = useState(null);



  useEffect(() => {

    const fetchFacility = async () => {
      try {
        const response = await fetch(`http://localhost:4000/facility/${id}`);
        const data = await response.json();
        setFacility(data);
        setEditedFacility(data);
        if (data.latitude && data.longitude) {
          setCoordinates([data.latitude, data.longitude]);
        }
      } catch (error) {
        console.error("Error fetching facility data:", error);
      }
    };

    fetchFacility();
  }, [id]);

  useEffect(() => {
    fetch("http://localhost:4000/facilities-types")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFacilitiesTypes(data);
        } else {
          setFetchError("Error al obtener los tipos de instalación.");
        }
      })
      .catch((error) => {
        console.error("Error al obtener los tipos de instalación:", error);
        setFetchError("Error al obtener los tipos de instalación.");
      });
  }, []);


  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancelClick = () => {
    setEditing(false);
    setEditedFacility(facility);
  };

  const handleChange = (e) => {
    setEditedFacility({ ...editedFacility, [e.target.name]: e.target.value });
  };

  const handleSaveClick = async () => {
    // Validar que todos los campos esenciales estén presentes
    const { name, location, facility_type, latitude, longitude } = editedFacility;

    if (!name || !location || !facility_type || latitude === "" || longitude === "") {
      alert("Todos los campos son obligatorios.");
      return; // Detiene la ejecución si hay un campo vacío
    }

    try {
      const response = await fetch(`http://localhost:4000/facility/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedFacility),
      });

      if (response.ok) {
        setFacility(editedFacility);
        setEditing(false);
      } else {
        alert("Hubo un error al actualizar la instalación.");
      }
    } catch (error) {
      console.error("Error updating facility data:", error);
      alert("Error al conectar con el servidor.");
    }
  };


  if (!facility) return <div className="loading">Loading...</div>;

  return (

      <div className="content-map">
        <div className="facility-view">
          <aside className="facility-map">
            {coordinates ? (
              <MapContainer center={coordinates} zoom={17} className="map" style={{ height: "600px", width: "100%" }}>
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
            <div className="details-content">
              <div className="details-text">
                <h2>{editing ? "Editando instalación" : facility.name}</h2>
              </div>
              {!editing && (
                <button className="edit-btn" onClick={handleEditClick}>
                  <FaEdit /> Editar
                </button>
              )}
            </div>

            {editing ? (
              <div className="edit-container">
                <div className="edit-fields">
                  <label>Nombre:</label>
                  <input name="name" value={editedFacility.name} onChange={handleChange} />

                  <label>Ubicación:</label>
                  <input name="location" value={editedFacility.location} onChange={handleChange} />

                  <label>Tipo:</label>
                  <select
                    name="facility_type"
                    value={editedFacility.facility_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar tipo de instalación...</option>
                    {facilitiesTypes.map((facility) => (
                      <option key={facility.id} value={facility.type}>
                        {facility.type}
                      </option>
                    ))}
                  </select>
                  {fetchError && <p className="error">{fetchError}</p>}


                  <label>Latitud:</label>
                  <input name="latitude" value={editedFacility.latitude} onChange={handleChange} />

                  <label>Longitud:</label>
                  <input name="longitude" value={editedFacility.longitude} onChange={handleChange} />
                </div>
                <div className="edit-buttons">
                  <button className="save-btn" onClick={handleSaveClick}><FaSave /> Guardar</button>
                  <button className="cancel-btn" onClick={handleCancelClick}><FaTimes /> Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Ubicación:</strong> {facility.location}</p>
                <p><strong>Tipo:</strong> {facility.facility_type}</p>
                {coordinates && (
                  <>
                    <p><strong>Latitud:</strong> {coordinates[0]}</p>
                    <p><strong>Longitud:</strong> {coordinates[1]}</p>
                  </>
                )}
              </div>
            )}



          </main>
        </div>
      </div>
  );
};

export default FacilityView;
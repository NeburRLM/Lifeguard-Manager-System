import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();


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
          setFetchError(t("facility-view.error-types"));
        }
      })
      .catch((error) => {
        console.error("Error al obtener los tipos de instalación:", error);
        setFetchError(t("facility-view.error-types"));
      });
  }, [t]);


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
      alert(t("facility-view.error-require"));
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
        alert(t("facility-view.error-update"));
      }
    } catch (error) {
      console.error("Error updating facility data:", error);
      alert("facility-view.error-server");
    }
  };


  if (!facility) return <div className="loading">{t("facility-view.loading")}</div>;

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
              <p>{t("facility-view.loading-map")}.</p>
            )}
          </aside>
          <main className="facility-details">
            <div className="details-content">
              <div className="details-text">
                <h2>{editing ? t("facility-view.editing") : facility.name}</h2>
              </div>
              {!editing && (
                <button className="edit-btn" onClick={handleEditClick}>
                  <FaEdit /> {t("facility-view.edit")}
                </button>
              )}
            </div>

            {editing ? (
              <div className="edit-container">
                <div className="edit-fields">
                  <label>{t("facility-view.name")}</label>
                  <input name="name" value={editedFacility.name} onChange={handleChange} />

                  <label>{t("facility-view.location")}</label>
                  <input name="location" value={editedFacility.location} onChange={handleChange} />

                  <label>{t("facility-view.type")}</label>
                  <select
                    name="facility_type"
                    value={editedFacility.facility_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t("facility-view.type")}</option>
                    {facilitiesTypes.map((facility) => (
                      <option key={facility.id} value={facility.type}>
                        {t(`type-facilities.${facility.type}`, facility.type)}
                      </option>
                    ))}

                  </select>
                  {fetchError && <p className="error">{fetchError}</p>}


                  <label>Latitud:</label>
                  <input name={t("facility-view.latitude")} value={editedFacility.latitude} onChange={handleChange} />

                  <label>Longitud:</label>
                  <input name={t("facility-view.longitude")} value={editedFacility.longitude} onChange={handleChange} />
                </div>
                <div className="edit-buttons">
                  <button className="save-btn" onClick={handleSaveClick}><FaSave /> {t("facility-view.save")}</button>
                  <button className="cancel-btn" onClick={handleCancelClick}><FaTimes /> {t("facility-view.cancel")}</button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>{t("facility-view.location")}</strong> {facility.location}</p>
                <p>
                  <strong>{t("facility-view.type")}</strong>{" "}
                  {t(`type-facilities.${facility.facility_type}`, facility.facility_type)}
                </p>
                {coordinates && (
                  <>
                    <p><strong>{t("facility-view.latitude")}</strong> {coordinates[0]}</p>
                    <p><strong>{t("facility-view.longitude")}</strong> {coordinates[1]}</p>
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AddFacility.css";

const AddFacility = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    facility_type: "",
    latitude: "",
    longitude: "",
  });

  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState(""); // Estado para errores
  const [showMapModal, setShowMapModal] = useState(false); // Estado para mostrar/ocultar modal
  const { t } = useTranslation();

  // Manejo de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Limpiar error al escribir
    e.target.setCustomValidity(""); // Limpiar mensajes de validación al escribir
  };

  useEffect(() => {
    fetch("http://localhost:4000/facilities-types")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFacilities(data); // Actualizar el estado con los roles obtenidos
        } else {
          setError(t("add-facility.facility-error"));
        }
      })
      .catch((error) => {
        console.error("Error al obtener las instalaciones:", error);
        setError(t("add-facility.facility-error"));
      });
  }, [t]);

const openMapModal = () => {
  setShowMapModal(true);
  // Inicializar el mapa en el siguiente ciclo del renderizado
  setTimeout(() => {
    const map = L.map("modal-map"); // Crear el mapa sin vista inicial

    // Si se seleccionó un lugar anteriormente, centrar en ese lugar, de lo contrario en Cataluña
    const hasSelectedLocation = formData.latitude && formData.longitude;
    const initialCoords = hasSelectedLocation
      ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
      : [41.3851, 2.1734]; // Coordenadas de Cataluña por defecto

    const initialZoom = hasSelectedLocation ? 15 : 7; // Usar un zoom más cercano si ya hay una ubicación seleccionada
    map.setView(initialCoords, initialZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Crear un marcador solo si ya hay una ubicación seleccionada
    let marker = null;
    if (hasSelectedLocation) {
      marker = L.marker(initialCoords, { draggable: true }).addTo(map);
    }

    // Evento de clic en el mapa para actualizar latitud y longitud
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setFormData({ ...formData, latitude: lat.toFixed(6), longitude: lng.toFixed(6) });

      // Si no existe un marcador, crearlo; si ya existe, moverlo
      if (!marker) {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      } else {
        marker.setLatLng([lat, lng]);
      }
    });

    // Limpiar el mapa al desmontar el modal
    return () => {
      map.remove();
    };
  }, 0);
};
  const closeMapModal = () => {
    setShowMapModal(false);
  };

  const validateField = (input) => {
    if (input.name === "name" && !input.value.trim()) {
      input.setCustomValidity(t("add-facility.error-required"));
    } else if (input.name === "location" && !input.value.trim()) {
      input.setCustomValidity(t("add-facility.error-required"));
    } else if (input.name === "facility_type" && !input.value) {
      input.setCustomValidity(t("add-facility.error-required"));
    } else if (input.name === "latitude" && (isNaN(parseFloat(input.value)) || input.value.trim() === "")) {
      input.setCustomValidity(t("add-facility.error-latitude"));
    } else if (input.name === "longitude" && (isNaN(parseFloat(input.value)) || input.value.trim() === "")) {
      input.setCustomValidity(t("add-facility.error-longitude"));
    } else if (input.name === "latitude" && (parseFloat(input.value) < -90 || parseFloat(input.value) > 90)) {
      input.setCustomValidity(t("add-facility.error-latitude2"));
    } else if (input.name === "longitude" && (parseFloat(input.value) < -180 || parseFloat(input.value) > 180)) {
      input.setCustomValidity(t("add-facility.error-longitude2"));
    } else {
      input.setCustomValidity(""); // Validación exitosa
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const inputs = form.querySelectorAll("input, select");
    let formIsValid = true;

    inputs.forEach((input) => {
      validateField(input);
      if (!input.checkValidity()) {
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      form.reportValidity(); // Muestra los mensajes de error personalizados
      return;
    }

    // Obtener token de sessionStorage
    const token = sessionStorage.getItem("Token");
    if (!token) {
      alert("No estás autorizado. Por favor inicia sesión.");
      return;
    }

    // Enviar la solicitud POST al backend
    fetch("http://localhost:4000/facility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json(); // Si la respuesta no es exitosa, parseamos la respuesta JSON
        }
        return response.json(); // Si la respuesta es exitosa, procesamos el JSON
      })
      .then((data) => {
        console.log("Respuesta del servidor:", data);
        if (data.status === "Success") {
          alert(t("add-facility.add-ok"));
          navigate("/facilities"); // Redirigir a la lista de instalaciones
        } else {
          console.log("Error específico:", data.message);
          if (data.message.includes("Ya existe una instalación con el nombre")) {
            setError(t("add-facility.facility-exist"));
          }
          if (data.message.includes("Ya existe una instalación en las coordenadas")) {
            setError(t("add-facility.facility-exist2"));
          } else {
            setError(data.message || t("add-facility.error-add"));
          }
        }
      })
      .catch((error) => {
        console.error("Error al agregar instalación:", error);
        setError(t("add-facility.error-add"));
      });
  };

  const handleCancel = () => navigate(-1);

  return (
    <div className="add-facility-container">
      <h2>{t("add-facility.title")}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>{t("add-facility.name")}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
        </div>

        <div className="form-group">
          <label>{t("add-facility.location")}</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
        </div>

        <div className="form-group">
          <label>{t("add-facility.type")}</label>
          <div className="content-selectFac">
            <select
              name="facility_type"
              value={formData.facility_type}
              onChange={handleInputChange}
              onInvalid={(e) => validateField(e.target)}
              required
            >
              <option value="">{t("add-facility.select-type")}</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.type}>
                  {facility.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{t("add-facility.latitude")}</label>
          <input
            type="text"
            name="latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>{t("add-facility.longitude")}</label>
          <input
            type="text"
            name="longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            readOnly
          />
        </div>

        <div className="form-group location-selector">
          <small className="location-note">{t("add-facility.map-note")}</small>
          <button type="button" className="map-button" onClick={openMapModal}>
            {t("add-facility.open-map")}
          </button>
        </div>


        {showMapModal && (
          <div className="modal" onClick={closeMapModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close-button" onClick={closeMapModal}>
                &times;
              </span>
              <div id="modal-map" className="map-container"></div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button type="submit" className="submit-button">
            {t("add-facility.add-facility")}
          </button>
          <button type="button" className="cancel-button" onClick={handleCancel}>
            {t("add-facility.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFacility;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./AddFacility.css"; // Archivo de estilos

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
            required
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
            required
          />
        </div>

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
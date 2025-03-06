import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const [error, setError] = useState(""); // Estado para errores

  // Manejo de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Limpiar error al escribir
  };

  // Validar y enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de campos vacíos
    if (!formData.name || !formData.location || !formData.facility_type || !formData.latitude || !formData.longitude) {
      setError("Todos los campos son obligatorios.");
      return;
    }

     // Validación de coordenadas (si se proporcionan)
     const latitude = parseFloat(formData.latitude);
     const longitude = parseFloat(formData.longitude);

     if (formData.latitude && isNaN(latitude)) {
       setError("La latitud debe ser un número.");
       return;
     }

     if (formData.longitude && isNaN(longitude)) {
       setError("La longitud debe ser un número.");
       return;
     }

     // Validación de rango de latitud y longitud
     if (formData.latitude && (latitude < -90 || latitude > 90)) {
       setError("La latitud debe estar entre -90 y 90.");
       return;
     }

     if (formData.longitude && (longitude < -180 || longitude > 180)) {
       setError("La longitud debe estar entre -180 y 180.");
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
          alert("¡Instalación agregada con éxito!");
          navigate("/facilities"); // Redirigir a la lista de instalaciones
        } else {
          console.log("Error específico:", data.message);
          if (data.message.includes("Ya existe una instalación con el nombre")) {
            setError("Ya existe una instalación con este nombre y ubicación.");
          }
          if (data.message.includes("Ya existe una instalación en las coordenadas")) {
            setError("Ya existe una instalación con esta longitud y latitud.");
          }
          else {
            setError(data.message || "Hubo un error al agregar la instalación.");
          }
        }
      })
      .catch((error) => {
        console.error("Error al agregar instalación:", error);
        setError("Hubo un error al agregar la instalación.");
      });
  };

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Función para cancelar y volver atrás
  const handleCancel = () => navigate(-1);

  return (
    <div className="add-facility-container">
      <h2>Add New Facility</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Facility Type</label>
          <input type="text" name="facility_type" value={formData.facility_type} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Latitude</label>
          <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Longitude</label>
          <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} required />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button type="submit" className="submit-button">Add Facility</button>
          <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddFacility;

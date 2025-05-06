import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ManageFacilities.css"; // Archivo CSS para estilos

function ManageFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  // Cargar las instalaciones al montar el componente
  useEffect(() => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setFacilities(data);
          setFilteredFacilities(data);
        } else {
          alert(t("manage-facilities.no-facilities"));
        }
      })
      .catch((error) => console.log("Error fetching facilities:", error));
  }, [t]);


const handleSearch = (e) => {
   const value = e.target.value;
   setSearchTerm(value);

   const normalizeString = (str) =>
     str ? str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

   setFilteredFacilities(
     facilities.filter((facility) =>
       normalizeString(facility.name).includes(normalizeString(value))
     )
   );
 };




const handleDelete = (id) => {
    // Obtener el token del sessionStorage
    const token = sessionStorage.getItem("Token");

    // Verificar si el token está presente
    if (!token) {
      alert("No token found, please log in again.");
      return;
    }
    const confirmDelete = window.confirm(t("manage-facilities.confirm-delete"));
    if (!confirmDelete) return;
    // Configuración de la solicitud con el token en los encabezados
    fetch(`http://localhost:4000/facility/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`, // Pasar el token en el encabezado Authorization
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        // Verificamos si la respuesta es exitosa
        if (!response.ok) {
          return Promise.reject("Error deleting facility");
        }
        return response.text();  // Cambiar .json() por .text()
      })
      .then((message) => {
        // Verificamos el mensaje de la respuesta
        if (message.includes("eliminada correctamente")) {  // Verificamos si el mensaje contiene "eliminado correctamente"
          // Si la eliminación fue exitosa, actualizamos el estado de los empleados
          const updatedFacilities = facilities.filter((facility) => facility.id !== id);
          setFacilities(updatedFacilities);
          setFilteredFacilities(updatedFacilities);
          alert(t("manage-facilities.delete-ok"));  // Ventanita emergente de éxito
        } else {
          alert(t("manage-facilities.error-delete"));
        }
      })
      .catch((error) => {
        console.log("Error deleting facility:", error);
        alert(t("manage-facilities.error-delete"));
      });
  };




  return (
    <main className="content">
      <header className="header">
        <h4>{t("manage-facilities.title")}</h4>
      </header>

      <div className="facility-container">
        <h2>{t("manage-facilities.list")}</h2>

        <div className="add-btn-container">
          <Link to="/createFacility" className="add-btn">
            {t("manage-facilities.button-add")}
          </Link>
        </div>

        <div className="controlsFacilities">
          <input
            type="text"
            placeholder={t("manage-facilities.search-text")}
            value={searchTerm}
            onChange={handleSearch}
            className="search-inputFacilities"
          />
        </div>

        <table className="facility-table">
          <thead>
            <tr>
              <th>{t("manage-facilities.table.name")}</th>
              <th>{t("manage-facilities.table.type")}</th>
              <th>{t("manage-facilities.table.actions.title-actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.map((facility) => (
              <tr key={facility.id}>
                <td>{facility.name}</td>
                <td>{facility.facility_type}</td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/facilityview/${facility.id}`} className="view-btn">
                      👁 {t("manage-facilities.table.actions.view")}
                    </Link>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      className="delete-btn"
                    >
                      🗑 {t("manage-facilities.table.actions.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );

}

export default ManageFacilities;

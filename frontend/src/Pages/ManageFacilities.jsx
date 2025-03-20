import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageFacilities.css"; // Archivo CSS para estilos

function ManageFacilities() {
  const [facilities, setFacilities] = useState([]);


  // Cargar las instalaciones al montar el componente
  useEffect(() => {
    fetch("http://localhost:4000/facility")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setFacilities(data);
        } else {
          alert("No facilities found");
        }
      })
      .catch((error) => console.log("Error fetching facilities:", error));
  }, []);



const handleDelete = (id) => {
    // Obtener el token del sessionStorage
    const token = sessionStorage.getItem("Token");

    // Verificar si el token está presente
    if (!token) {
      alert("No token found, please log in again.");
      return;
    }
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta instalación?");
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
          setFacilities(facilities.filter((facility) => facility.id !== id));
          alert("Instalacion eliminada correctamente");  // Ventanita emergente de éxito
        } else {
          alert("Error deleting facility");
        }
      })
      .catch((error) => {
        console.log("Error deleting facility:", error);
        alert("Error deleting facility");
      });
  };




  return (


      <main className="content">
        <header className="header">
          <h4>Manage Facilities</h4>
        </header>

        <div className="facility-container">
          <h2>Facility List</h2>
           <div className="add-btn-container">
             <Link to="/createFacility" className="add-btn">➕ Add Facility</Link>
           </div>
          <table className="facility-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Facility Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td>{facility.name}</td>
                  <td>{facility.facility_type}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/facilityview/${facility.id}`} className="view-btn">👁 View</Link>
                      <button onClick={() => handleDelete(facility.id)} className="delete-btn">🗑 Delete</button>
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

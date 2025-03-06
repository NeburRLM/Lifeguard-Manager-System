import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "./ManageFacilities.css"; // Archivo CSS para estilos

function ManageFacilities() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [user, setUser] = useState(null); // Estado para el usuario logueado

  // Función para cerrar sesión
  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");

    navigate("/", { replace: true });
    window.history.pushState(null, "", "/"); // Evita que el usuario pueda regresar con el botón atrás
  };

  // Cargar las instalaciones al montar el componente
  useEffect(() => {
  fetchData();
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


const fetchData = () => {
        // Obtener el ID del usuario almacenado en sessionStorage
        const userId = sessionStorage.getItem("userId");
        if (userId) {
          fetch(`http://localhost:4000/employee/${userId}`)
            .then((response) => response.json())
            .then((data) => setUser(data))
            .catch((err) => console.log("Error fetching user data:", err));
        }
      };


const handleDelete = (id) => {
    // Obtener el token del sessionStorage
    const token = sessionStorage.getItem("Token");

    // Verificar si el token está presente
    if (!token) {
      alert("No token found, please log in again.");
      return;
    }

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
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>

        {/* Imagen del usuario logueado */}
                {user && (
                  <div className="user-profile">
                    <img src={user.image || "/default-avatar.jpg"} alt={user.name} className="profile-image" />
                    <p className="user-name">{user.name}</p>
                  </div>
                )}


        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/facilities">Manage Facilities</Link></li>
            <li><Link to="/payrolls">Manage Payrolls</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
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
    </div>
  );
}

export default ManageFacilities;

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa"; // Añadir iconos
import "./ManageEmployees.css"; // Archivo CSS

function ManageEmployees() {

  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null); // Estado para el usuario logueado

    const signOut = () => {
            sessionStorage.removeItem("Token");
            sessionStorage.removeItem("userId"); // También eliminamos el ID del usuario
            navigate("/");
          };
  useEffect(() => {
    fetchData();
    fetch("http://localhost:4000/employees")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setEmployees(data);
        } else {
          alert("No employees found");
        }
      })
      .catch((error) => console.log("Error fetching employees:", error));
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
    fetch(`http://localhost:4000/employee/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`, // Pasar el token en el encabezado Authorization
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        // Verificamos si la respuesta es exitosa
        if (!response.ok) {
          return Promise.reject("Error deleting employee");
        }
        return response.text();  // Cambiar .json() por .text()
      })
      .then((message) => {
        // Verificamos el mensaje de la respuesta
        if (message.includes("eliminado correctamente")) {  // Verificamos si el mensaje contiene "eliminado correctamente"
          // Si la eliminación fue exitosa, actualizamos el estado de los empleados
          setEmployees(employees.filter((employee) => employee.id !== id));
          alert("Empleado eliminado correctamente");  // Ventanita emergente de éxito
        } else {
          alert("Error deleting employee");
        }
      })
      .catch((error) => {
        console.log("Error deleting employee:", error);
        alert("Error deleting employee");
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
            <li><Link to="/profile">Profile</Link></li>
            <li><button className="logout-btn" onClick={signOut}><FaSignOutAlt /> Sign Out</button></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <header className="header">
          <h4>Manage Employees</h4>
        </header>

        <div className="employee-container">
          <h2>Employee List</h2>
          <div className="add-btn-container">
            <Link to="/create" className="add-btn">➕ Add Employee</Link>
          </div>
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={index}>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.role}</td>
                  <td className="action-buttons">
                    <Link to={`/employeeview/${employee.id}`} className="view-btn">👁 View</Link>
                    <button onClick={() => handleDelete(employee.id)} className="delete-btn">🗑 Delete</button>
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

export default ManageEmployees;

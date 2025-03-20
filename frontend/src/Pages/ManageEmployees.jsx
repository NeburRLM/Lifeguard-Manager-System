import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageEmployees.css";

function ManageEmployees() {

  const [employees, setEmployees] = useState([]);


  useEffect(() => {
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


  const handleDelete = (id) => {
    // Obtener el token del sessionStorage
    const token = sessionStorage.getItem("Token");

    // Verificar si el token está presente
    if (!token) {
      alert("No token found, please log in again.");
      return;
    }
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este empleado?");
    if (!confirmDelete) return;
    // Configuración de la solicitud con el token en los encabezados
    fetch(`http://localhost:4000/employee/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
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
          alert("Empleado eliminado correctamente");  // Ventanita emergene de éxito
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
      <main className="content">
        <header className="header">
          <h4>Manage Employees</h4>
        </header>

        <div className="employee-container">
          <h2>Employee List</h2>
          <div className="add-btn-container">
            <Link to="/createEmployee" className="add-btn">➕ Add Employee</Link>
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
                  <td>
                    <div className="action-buttons">
                      <Link to={`/employeeview/${employee.id}`} className="view-btn">👁 View</Link>
                      <button onClick={() => handleDelete(employee.id)} className="delete-btn">🗑 Delete</button>
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

export default ManageEmployees;

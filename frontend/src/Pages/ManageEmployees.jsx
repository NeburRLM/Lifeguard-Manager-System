import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageEmployees.css";

function ManageEmployees() {

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");


  useEffect(() => {
    fetch("http://localhost:4000/employees")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setEmployees(data);
          setFilteredEmployees(data);
        } else {
          alert("No employees found");
        }
      })
      .catch((error) => console.log("Error fetching employees:", error));
  }, []);


 const handleSearch = (e) => {
   const value = e.target.value;
   setSearchTerm(value);

   const normalizeString = (str) =>
     str ? str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

   setFilteredEmployees(
     employees.filter((employee) =>
       normalizeString(employee.name).includes(normalizeString(value)) ||
       normalizeString(employee.email).includes(normalizeString(value)) ||
       normalizeString(employee.id).includes(normalizeString(value)) // Ahora busca también por DNI
     )
   );
 };



   const handleSort = () => {
       const sortedEmployees = [...filteredEmployees].sort((a, b) =>
         sortOrder === "asc"
           ? a.name.localeCompare(b.name)
           : b.name.localeCompare(a.name)
       );

       setFilteredEmployees(sortedEmployees);
       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
     };


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
          const updatedEmployees = employees.filter((employee) => employee.id !== id);
          setEmployees(updatedEmployees);
          setFilteredEmployees(updatedEmployees);
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
                <Link to="/createEmployee" className="add-btn">
                  ➕ Add Employee
                </Link>
              </div>

              <div className="controlsEmployees">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o DNI"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-inputEmployees"
                />
                <button onClick={handleSort} className="sort-btnEmployees">
                  Ordenar Alfabéticamente {sortOrder === "asc" ? "↑" : "↓"}
                </button>
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
                  {filteredEmployees.map((employee, index) => (
                    <tr key={index}>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.role}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/employeeview/${employee.id}`} className="view-btn">
                            👁 View
                          </Link>
                          <button onClick={() => handleDelete(employee.id)} className="delete-btn">
                            🗑 Delete
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

export default ManageEmployees;

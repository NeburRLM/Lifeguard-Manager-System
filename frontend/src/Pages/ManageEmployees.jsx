import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageEmployees.css";
import { useTranslation } from "react-i18next";

function ManageEmployees() {

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const { t } = useTranslation();


  useEffect(() => {
    fetch("http://localhost:4000/employees")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          setEmployees(data);
          setFilteredEmployees(data);
        } else {
          alert(t("manage-employees.no-employees"));
        }
      })
      .catch((error) => console.log("Error fetching employees:", error));
  }, [t]);


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
    const confirmDelete = window.confirm(t("manage-employees.confirm-delete"));
    if (!confirmDelete) return;
    // Configuración de la solicitud con el token en los encabezados
    fetch(`http://localhost:4000/employee/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((response) => {
        // Verificamos si la respuesta es exitosa
        if (!response.ok) {
          return Promise.reject(t("manage-employees.error-delete"));
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
        alert(t("manage-employees.error-delete"));
      });
  };


  return (
      <main className="content">
            <header className="header">
              <h4>{t("manage-employees.title")}</h4>
            </header>

            <div className="employee-container">
              <h2>{t("manage-employees.list")}</h2>

              <div className="add-btn-container">
                <Link to="/createEmployee" className="add-btn">
                  {t("manage-employees.button-add")}
                </Link>
              </div>

              <div className="controlsEmployees">
                <input
                  type="text"
                  placeholder={t("manage-employees.search-text")}
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-inputEmployees"
                />
                <button onClick={handleSort} className="sort-btnEmployees">
                  {t("manage-employees.order-text")} {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              <table className="employee-table">
                <thead>
                  <tr>
                    <th>{t("manage-employees.table.name")}</th>
                    <th>{t("manage-employees.table.dni")}</th>
                    <th>{t("manage-employees.table.email")}</th>
                    <th>{t("manage-employees.table.role")}</th>
                    <th>{t("manage-employees.table.actions.title-actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee, index) => (
                    <tr key={index}>
                      <td>{employee.name}</td>
                      <td>{employee.id}</td>
                      <td>{employee.email}</td>
                      <td>{employee.role}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/employeeview/${employee.id}`} className="view-btn">
                            👁 {t("manage-employees.table.actions.view")}
                          </Link>
                          <button onClick={() => handleDelete(employee.id)} className="delete-btn">
                            🗑 {t("manage-employees.table.actions.delete")}
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

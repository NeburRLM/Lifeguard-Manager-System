import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Employee.css"; // Archivo CSS

function Employee() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4001/employees")
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
    fetch(`http://localhost:4001/delete/${id}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        if (data.Status === "Success") {
          setEmployees(employees.filter((employee) => employee.id !== id)); // Eliminamos del estado
        } else {
          alert("Error deleting employee");
        }
      })
      .catch((error) => console.log("Error deleting employee:", error));
  };

  return (
    <div className="employee-container">
      <h2>Employee List</h2>
      <Link to="/create" className="add-btn">➕ Add Employee</Link>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee, index) => (
            <tr key={index}>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>
                <Link to={`/employeeedit/${employee.id}`} className="edit-btn">✏ Edit</Link>
                <button onClick={() => handleDelete(employee.id)} className="delete-btn">🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Employee;

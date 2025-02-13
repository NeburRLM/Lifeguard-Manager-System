import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageEmployees.css"; // Archivo CSS

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
    fetch(`http://localhost:4000/delete/${id}`, { method: "DELETE" })
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><button className="logout-btn">Sign Out</button></li>
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
      </main>
    </div>
  );
}

export default ManageEmployees;

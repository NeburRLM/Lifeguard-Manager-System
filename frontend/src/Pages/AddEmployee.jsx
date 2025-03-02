import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddEmployee.css"; // Aquí puedes agregar el CSS si lo necesitas

const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "",
    email: "",
    birthdate: "",
    phone_number: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Recuperar el token desde sessionStorage
    const token = sessionStorage.getItem("Token");

    // Comprobar si el token existe antes de hacer la solicitud
    if (!token) {
      alert("No estás autorizado. Por favor inicia sesión.");
      return;
    }

    // Aquí se hace la petición POST al backend con el token en la cabecera
    fetch("http://localhost:4000/employee", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Enviar el token en el encabezado de autorización
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          // Si la respuesta no es exitosa, lanzamos un error
          throw new Error("Error al agregar empleado");
        }
        return response.json(); // Si la respuesta es exitosa, procesamos el JSON
      })
      .then((data) => {
        // Verifica el campo de la respuesta (ajusta esto según tu API)
        if (data.status === "Success") {
          // Si todo ha ido bien, mostramos un mensaje de éxito
          alert("¡Empleado agregado con éxito!");
          // Redirigimos al usuario a la página de empleados
          navigate("/employees");
        } else {
          // Si hay algún error específico en la respuesta, lo mostramos
          alert(data.message || "Hubo un error al agregar el empleado.");
        }
      })
      .catch((error) => {
        console.log("Error adding employee:", error);
        // Aquí también manejamos el caso de error de la solicitud
        alert("Hubo un error al agregar el empleado.");
        // Redirigimos al usuario de vuelta a la página anterior en caso de error
        navigate(-1);  // Regresar a la página anterior
      });
  };

  return (
    <div className="add-employee-container">
      <h2>Add New Employee</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Birthdate</label>
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Add Employee</button>
      </form>
    </div>
  );
};

export default AddEmployee;

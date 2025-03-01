import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCalendarAlt, FaEdit, FaSave } from "react-icons/fa"; // Añadir iconos
import "./EmployeeView.css"; // Archivo CSS mejorado

const EmployeeView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [user, setUser] = useState(null); // Estado para el usuario logueado
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalEmployee, setOriginalEmployee] = useState(null); // Para almacenar los datos originales

  // Función para cerrar sesión
  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/");
  };

  // Cargar datos del empleado
  useEffect(() => {
    fetchData();
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);
        setFormData(data); // Inicializa los datos del formulario
        setOriginalEmployee({ ...data }); // Guardamos los datos originales para restaurarlos si es necesario
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id]);

  // Cargar datos del usuario logueado
  const fetchData = () => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar cambios en la imagen
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const imageUrl = URL.createObjectURL(file);
    setFormData({ ...formData, image: imageUrl });
  };

  // Manejar el botón de eliminar imagen
  const handleDeleteImage = () => {
    setFormData({ ...formData, image: "" }); // Sólo actualizamos la vista local, no el backend
  };

  // Manejar la cancelación de la edición
  const handleCancelEdit = () => {
    setFormData({ ...originalEmployee }); // Restauramos los datos originales si se cancela la edición
    setIsEditing(false);
  };

  // Manejar la acción de guardar
  const handleSave = async () => {
    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        birthdate: formData.birthdate,
        phone_number: formData.phone_number,
        hourlyRate: formData.hourlyRate,
        image: formData.image,  // Aquí solo mandamos la imagen que el usuario ha modificado o dejado vacía
      };

      const response = await fetch(`http://localhost:4000/employee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        // Después de guardar, actualizamos los datos del empleado
        fetch(`http://localhost:4000/employee/${id}`)
          .then((res) => res.json())
          .then((updatedEmployee) => {
            setEmployee(updatedEmployee); // Actualizamos el estado del empleado
            setFormData(updatedEmployee);  // Restauramos los datos
            setIsEditing(false);  // Terminamos el modo de edición
          })
          .catch((err) => console.log("Error fetching updated employee data:", err));
      } else {
        console.log("Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error updating employee data:", error);
    }
  };

  // Verificación de datos cargados
  if (!employee) return <div className="loading">Loading...</div>;

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
          <h4>Employee Details</h4>
        </header>

        {/* Detalles del empleado con imagen */}
        <div className="employee-details-container">
          <div className="employee-info">
            {isEditing ? (
              <>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <img src={formData.image || "/default-avatar.jpg"} alt="Employee" className="employee-image" />
                {formData.image && (
                  <button className="delete-image-btn" onClick={handleDeleteImage}>
                    Eliminar Imagen
                  </button>
                )}
              </>
            ) : (
              <img src={employee.image || "/default-avatar.jpg"} alt={employee.name} className="employee-image" />
            )}

            <div className="details-grid">
              {isEditing ? (
                <>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                  <input type="text" name="role" value={formData.role} onChange={handleInputChange} />
                  <input type="text" name="birthdate" value={formData.birthdate} onChange={handleInputChange} />
                  <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
                  <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleInputChange} />
                </>
              ) : (
                <>
                  <h2>{employee.name}</h2>
                  <p><strong>Email:</strong> {employee.email}</p>
                  <p><strong>Role:</strong> {employee.role}</p>
                  <p><strong>Birthdate:</strong> {employee.birthdate}</p>
                  <p><strong>Phone:</strong> {employee.phone_number}</p>
                  <p><strong>Hourly Rate:</strong> ${employee.hourlyRate}</p>
                </>
              )}
            </div>
          </div>

          <div className="action-buttons">
            {isEditing ? (
              <>
                <button className="save-btn" onClick={handleSave}><FaSave /> Guardar</button>
                <button className="cancel-btn" onClick={handleCancelEdit}>Cancelar</button>
              </>
            ) : (
              <button className="edit-btn" onClick={() => setIsEditing(true)}><FaEdit /> Editar</button>
            )}
          </div>
        </div>

        {/* Cuadrantes de trabajo */}
        <div className="schedule-container">
          <h3>Work Schedule for {employee.name}</h3>
          <ul className="schedule-list">
            {employee.work_schedule && employee.work_schedule.length > 0 ? (
              employee.work_schedule.map((schedule) => (
                <li key={schedule.id} className="schedule-item">
                  <Link to={`/employeeview/${id}/schedule/${schedule.id}`} className="schedule-link">
                    <FaCalendarAlt /> {schedule.month}-{schedule.year}
                  </Link>
                </li>
              ))
            ) : (
              <p>No work schedules available.</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default EmployeeView;

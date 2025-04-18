import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaEdit, FaSave, FaPlus, FaSort, FaTimes } from "react-icons/fa";
import "./EmployeeView.css";

const EmployeeView = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    month: 1, // Por defecto Enero
    year: new Date().getFullYear(),
  });
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [error, setError] = useState(""); // Estado para errores
  const months = [
    { name: "Enero", value: 1 },
    { name: "Febrero", value: 2 },
    { name: "Marzo", value: 3 },
    { name: "Abril", value: 4 },
    { name: "Mayo", value: 5 },
    { name: "Junio", value: 6 },
    { name: "Julio", value: 7 },
    { name: "Agosto", value: 8 },
    { name: "Septiembre", value: 9 },
    { name: "Octubre", value: 10 },
    { name: "Noviembre", value: 11 },
    { name: "Diciembre", value: 12 },
  ];

  const handleMonthChange = (event) => {
    setNewSchedule({ ...newSchedule, month: parseInt(event.target.value) });
  };



  useEffect(() => {
    fetchData();
    fetch(`http://localhost:4000/employee/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setEmployee(data);
        setFormData(data);
      })
      .catch((error) => console.log("Error fetching employee data:", error));
  }, [id]);

  useEffect(() => {
    fetch("http://localhost:4000/roles-types")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRoles(data);
        } else {
          setError("Error al obtener los roles.");
        }
      })
      .catch((error) => {
        console.error("Error al obtener los roles:", error);
        setError("Error al obtener los roles.");
      });
  }, []);



  const fetchData = () => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.log("Error fetching user data:", err));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Limpiar error al escribir
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        file,
        previewImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleDeleteImage = () => {
    setFormData({ ...formData, image: "", previewImage: null });
  };

  const handleCancelEdit = () => {
    setFormData({
      ...employee,
      previewImage: null,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem("Token");
      let imageUrl = formData.image;

      // Si hay una nueva imagen, subirla primero
      if (formData.file) {
        const formDataImage = new FormData();
        formDataImage.append("image", formData.file);

        const uploadResponse = await fetch(`http://localhost:4000/employee/upload/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataImage,
        });

        if (!uploadResponse.ok) {
          console.error("Error al subir la imagen");
          return;
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.employee.image;
      }

      // Datos que se enviarán en la actualización
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        birthdate: formData.birthdate,
        phone_number: formData.phone_number,
        hourlyRate: formData.hourlyRate,
        image: imageUrl,
      };
      // Validar que todos los campos esenciales estén presentes
      const { name, email, role, birthdate, phone_number, hourlyRate } = formData;

      if (!name || !email || !role || !birthdate || !phone_number || hourlyRate === "") {
        alert("Todos los campos son obligatorios.");
        return; // Detiene la ejecución si hay un campo vacío
      }
      const response = await fetch(`http://localhost:4000/employee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        fetch(`http://localhost:4000/employee/${id}`)
          .then((res) => res.json())
          .then((updatedEmployee) => {
            setEmployee(updatedEmployee);
            setFormData(updatedEmployee);
            setIsEditing(false);

            if (updatedEmployee.id === user?.id) {
                setUser(updatedEmployee);
            }

          })
          .catch((err) => console.error("Error al recargar los datos del empleado:", err));
      } else {
        console.error("Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error al actualizar el empleado:", error);
    }
  };

  const handleScheduleInputChange = (e) => {
    setNewSchedule({ ...newSchedule, [e.target.name]: e.target.value });
  };

  const handleCreateSchedule = async () => {
    try {
      const token = sessionStorage.getItem("Token");
      const response = await fetch(`http://localhost:4000/employee/${id}/work-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month: newSchedule.month,
          year: newSchedule.year,
          schedules: [], // Suponiendo que solo pasas los horarios vacíos por ahora
        }),
      });

      if (response.ok) {
        const createdSchedule = await response.json();
        setEmployee((prev) => ({
          ...prev,
          work_schedule: [...prev.work_schedule, createdSchedule],
        }));
        setShowScheduleModal(false);
      } else {
        const error = await response.text();
        //setErrorMessage(error); // Mostrar el error recibido del backend
        setError(error);
      }
    } catch (error) {
      setError("Hubo un error al intentar crear el cuadrante.");
    }
  };
  useEffect(() => {
     if (error) {
       const timer = setTimeout(() => setError(""), 4000);
       return () => clearTimeout(timer);
     }
   }, [error]);


  const sortSchedules = (order) => {
    const sortedSchedules = [...employee.work_schedule].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEmployee({ ...employee, work_schedule: sortedSchedules });
    setShowSortOptions(false); // Cerrar el desplegable después de seleccionar una opción
  };

  if (!employee) return <div className="loading">Loading...</div>;

  return (

     <div>
        <header className="header">
          <h4>Employee Details</h4>
        </header>

        <div className="employee-details-container">
                  <div className="employee-info">
                    <div className="employee-image-section">
                      {isEditing ? (
                        <>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                          <img
                            src={formData.previewImage || formData.image || "/default-avatar.jpg"}
                            alt="Employee"
                            className="employee-image"
                          />
                          {formData.image && (
                            <button className="delete-image-btn" onClick={handleDeleteImage}>
                              Eliminar Imagen
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <img src={employee.image || "/default-avatar.jpg"} alt={employee.name} className="employee-image" />
                          <h3 className="employee-name">{employee.name}</h3> {/* Nombre debajo de la imagen */}
                        </>
                      )}
                    </div>

                    <div className="details-grid">
                      {isEditing ? (
                        <>
                          <div className="input-group">
                            <label htmlFor="name">Nombre</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="role">Rol</label>
                            <div className="content-selectRole">
                              <select name="role" value={formData.role} onChange={handleInputChange} required>
                                <option value="">Seleccionar rol...</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.type}>
                                    {role.type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="input-group">
                            <label htmlFor="birthdate">Fecha de Nacimiento</label>
                            <input type="text" name="birthdate" value={formData.birthdate} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="phone_number">Teléfono</label>
                            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
                          </div>

                        </>
                      ) : (
                        <>
                          <p><strong>DNI:</strong> {employee.id}</p>
                          <p><strong>Email:</strong> {employee.email}</p>

                          <p><strong>Role:</strong> {employee.role}</p>
                          <p><strong>Phone:</strong> {employee.phone_number}</p>
                          <p><strong>Birthdate:</strong> {employee.birthdate}</p>
                          <p><strong>Hire date:</strong> {new Date(employee.hire_date).toLocaleDateString("es-ES")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="action-buttons">
                    {isEditing ? (
                      <>
                        <button className="save-btn green-btn" onClick={handleSave}><FaSave /> Guardar</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}><FaTimes />Cancelar</button>
                      </>
                    ) : (
                      <button className="edit-btn" onClick={() => setIsEditing(true)}><FaEdit /> Editar</button>
                    )}
                  </div>
                </div>

        <div className="schedule-container">
          <h3>Work Schedule for {employee.name}</h3>
          <div className="schedule-actions">
            <button className="create-schedule-btn" onClick={() => setShowScheduleModal(true)}>
              <FaPlus className="plus-icon" /> Nuevo Cuadrante
            </button>
            <div className="sort-container">
                <button className="sort-btn" onClick={() => setShowSortOptions(!showSortOptions)}>
                  <FaSort /> Ordenar por
                </button>
                {showSortOptions && (
                  <div className="sort-options">
                    <button className="sort-option" onClick={() => sortSchedules("asc")}>Mes y Año Ascendente</button>
                    <button className="sort-option" onClick={() => sortSchedules("desc")}>Mes y Año Descendente</button>
                  </div>
                )}
              </div>

          </div>

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


      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Crear Nuevo Cuadrante</h3>

            <div className="input-group">
              <label>Mes</label>
              <select value={newSchedule.month} onChange={handleMonthChange}>
                <option value="">Seleccione un mes</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Año</label>
              <select name="year" value={newSchedule.year} onChange={handleScheduleInputChange}>
                <option value="">Seleccione un año</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-buttons">
              <button className="save-btn green-btn" onClick={handleCreateSchedule}>
                <FaSave /> Guardar
              </button>
              <button className="cancel-btn" onClick={() => setShowScheduleModal(false)}>
                <FaTimes /> Cancelar
              </button>
            </div>

          </div>
        </div>
     )}
    </div>
  );
};

export default EmployeeView;
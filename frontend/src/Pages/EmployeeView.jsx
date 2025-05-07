import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaEdit, FaSave, FaPlus, FaSort, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./EmployeeView.css";

const EmployeeView = () => {
  const { t } = useTranslation();
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
    { name: t("employee-view.months.1"), value: 1 },
    { name: t("employee-view.months.2"), value: 2 },
    { name: t("employee-view.months.3"), value: 3 },
    { name: t("employee-view.months.4"), value: 4 },
    { name: t("employee-view.months.5"), value: 5 },
    { name: t("employee-view.months.6"), value: 6 },
    { name: t("employee-view.months.7"), value: 7 },
    { name: t("employee-view.months.8"), value: 8 },
    { name: t("employee-view.months.9"), value: 9 },
    { name: t("employee-view.months.10"), value: 10 },
    { name: t("employee-view.months.11"), value: 11 },
    { name: t("employee-view.months.12"), value: 12 },
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
          setError(t("employee-view.error-roles"));
        }
      })
      .catch((error) => {
        console.error("Error al obtener los roles:", error);
        setError(t("employee-view.error-roles"));
      });
  }, [t]);



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
        alert(t("employee-view.error-require"));
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
        if(error === "No se puede crear un cuadrante para un mes/año pasado."){
            setError(t("employee-view.error-workSchedule-1"));
        }
        else if (error === "Empleado no encontrado."){
            setError(t("employee-view.error-workSchedule-2"));
        }
        else if (error === "Ya existe un cuadrante mensual para este empleado en ese mes y año."){
            setError(t("employee-view.error-workSchedule-3"));
        }
        else{
            setError(t("employee-view.error-workSchedule-4"));
        }
      }
    } catch (error) {
      setError(t("employee-view.error-workSchedule-5"));
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

  if (!employee) return <div className="loading">employee-view.loading</div>;

  return (

     <div>
        <header className="header">
          <h4>{t("employee-view.title")}</h4>
        </header>

        <div className="employee-details-container">
                  <div className="employee-info">
                    <div className="employee-image-section">
                      {isEditing ? (
                        <>
                          <label className="custom-file-upload">
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                            {t("employee-view.select-file")}
                          </label>
                          <img
                            src={formData.previewImage || formData.image || "/default-avatar.jpg"}
                            alt="Employee"
                            className="employee-image"
                          />
                          {formData.image && (
                            <button className="delete-image-btn" onClick={handleDeleteImage}>
                              {t("employee-view.delete-image")}
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
                            <label htmlFor="name">{t("employee-view.name")}</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="email">{t("employee-view.email")}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="role">{t("employee-view.role")}</label>
                            <div className="content-selectRole">
                              <select name="role" value={formData.role} onChange={handleInputChange} required>
                                <option value="">{t("employee-view.select-role")}</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.type}>
                                    {t(`roles.${role.type}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="input-group">
                            <label htmlFor="birthdate">{t("employee-view.birthdate")}</label>
                            <input type="text" name="birthdate" value={formData.birthdate} onChange={handleInputChange} />
                          </div>
                          <div className="input-group">
                            <label htmlFor="phone_number">{t("employee-view.number")}</label>
                            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
                          </div>

                        </>
                      ) : (
                        <>
                          <p><strong>{t("employee-view.dni")}:</strong> {employee.id}</p>
                          <p><strong>{t("employee-view.email")}:</strong> {employee.email}</p>

                          <p><strong>{t("employee-view.role")}:</strong> {t(`roles.${employee.role}`)}</p>
                          <p><strong>{t("employee-view.number")}:</strong> {employee.phone_number}</p>
                          <p><strong>{t("employee-view.birthdate")}:</strong> {employee.birthdate}</p>
                          <p><strong>{t("employee-view.hire-date")}:</strong> {new Date(employee.hire_date).toLocaleDateString("es-ES")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="action-buttons">
                    {isEditing ? (
                      <>
                        <button className="save-btn green-btn" onClick={handleSave}><FaSave /> {t("employee-view.save")}</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}><FaTimes />{t("employee-view.cancel")}</button>
                      </>
                    ) : (
                      <button className="edit-btn" onClick={() => setIsEditing(true)}><FaEdit /> {t("employee-view.edit")}</button>
                    )}
                  </div>
                </div>

        <div className="schedule-container">
          <h3>{t("employee-view.work-schedule")} {employee.name}</h3>
          <div className="schedule-actions">
            <button className="create-schedule-btn" onClick={() => setShowScheduleModal(true)}>
              <FaPlus className="plus-icon" /> {t("employee-view.new-work")}
            </button>
            <div className="sort-container">
                <button className="sort-btn" onClick={() => setShowSortOptions(!showSortOptions)}>
                  <FaSort /> {t("employee-view.order-by")}
                </button>
                {showSortOptions && (
                  <div className="sort-options">
                    <button className="sort-option" onClick={() => sortSchedules("asc")}>{t("employee-view.asc")}</button>
                    <button className="sort-option" onClick={() => sortSchedules("desc")}>{t("employee-view.desc")}</button>
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
              <p>{t("employee-view.no-work")}</p>
            )}
          </ul>
        </div>


      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{t("employee-view.create-work")}</h3>

            <div className="input-group">
              <label>{t("employee-view.month")}</label>
              <select value={newSchedule.month} onChange={handleMonthChange}>
                <option value="">{t("employee-view.select-month")}</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>{t("employee-view.year")}</label>
              <select name="year" value={newSchedule.year} onChange={handleScheduleInputChange}>
                <option value="">{t("employee-view.select-year")}</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-buttons">
              <button className="save-btn green-btn" onClick={handleCreateSchedule}>
                <FaSave /> {t("employee-view.save")}
              </button>
              <button className="cancel-btn" onClick={() => setShowScheduleModal(false)}>
                <FaTimes /> {t("employee-view.cancel")}
              </button>
            </div>

          </div>
        </div>
     )}
    </div>
  );
};

export default EmployeeView;
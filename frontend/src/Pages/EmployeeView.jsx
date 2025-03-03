import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCalendarAlt, FaEdit, FaSave } from "react-icons/fa";
import "./EmployeeView.css";

const EmployeeView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const signOut = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("userId");
    navigate("/");
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

      const response = await fetch(`http://localhost:4000/employee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        // 🛠️ *SOLUCIÓN*: Hacer una nueva petición para obtener los datos actualizados
        fetch(`http://localhost:4000/employee/${id}`)
          .then((res) => res.json())
          .then((updatedEmployee) => {
            setEmployee(updatedEmployee);
            setFormData(updatedEmployee);
            setIsEditing(false);
          })
          .catch((err) => console.error("Error al recargar los datos del empleado:", err));
      } else {
        console.error("Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error al actualizar el empleado:", error);
    }
  };


  if (!employee) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="logo">Admin Dashboard</h2>

        {user && (
          <div className="user-profile">
            <img
              src={formData.previewImage || user.image || "/default-avatar.jpg"}
              alt={user.name}
              className="profile-image"
            />
            <p className="user-name">{user.name}</p>
          </div>
        )}

        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/employees">Manage Employees</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button className="logout-btn" onClick={signOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="content">
        <header className="header">
          <h4>Employee Details</h4>
        </header>

        <div className="employee-details-container">
          <div className="employee-info">
            {isEditing ? (
              <>
                <input type="file" accept="image/*" onChange={handleFileChange} />
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

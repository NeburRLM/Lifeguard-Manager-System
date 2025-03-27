import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "./ProfileView.css";

function ProfileView() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:4000/employee/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          setUser(data);
          setFormData(data);
        })
        .catch((err) => console.error("Error fetching user data:", err));
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

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

  const handleCancelEdit = () => {
    setFormData({
      ...user,
      previewImage: null,
    });
    setIsEditing(false);
  };

  const handleDeleteImage = () => {
    setFormData({ ...formData, image: "", previewImage: null });
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem("Token");
      let imageUrl = formData.image;

      if (formData.file) {
        const formDataImage = new FormData();
        formDataImage.append("image", formData.file);

        const uploadResponse = await fetch(
          `http://localhost:4000/employee/upload/${user.id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataImage,
          }
        );

        if (!uploadResponse.ok) {
          console.error("Error uploading image");
          return;
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.employee.image;
      }

      const dataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        birthdate: formData.birthdate,
        phone_number: formData.phone_number,
        hourlyRate: formData.hourlyRate,
        image: imageUrl,
      };

      const { name, email, role, birthdate, phone_number, hourlyRate } = formData;

      if (!name || !email || !role || !birthdate || !phone_number || hourlyRate === "") {
        alert("Todos los campos son obligatorios.");
        return;
      }

      const response = await fetch(
        `http://localhost:4000/employee/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (response.ok) {
        fetch(`http://localhost:4000/employee/${user.id}`)
          .then((res) => res.json())
          .then((updatedUser) => {
            setUser(updatedUser);
            setFormData(updatedUser);
            setIsEditing(false);

            if (updatedUser.id === user?.id) {
              setUser(updatedUser);
            }
          })
          .catch((err) => console.error("Error al recargar los datos del empleado:", err));
      } else {
        console.error("Error updating profile");
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  if (!user) return <div className="loading">Cargando...</div>;

  return (

    <div>
            <header className="header">
              <h4>Profile User</h4>
            </header>
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-image-section">
          {isEditing ? (
            <>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <img
                src={formData.previewImage || formData.image || "/default-avatar.jpg"}
                alt="Employee"
                className="employeeP-image"
              />
              {formData.image && (
                <button className="deleteProfile-image-btn" onClick={handleDeleteImage}>
                  Eliminar Imagen
                </button>
              )}
            </>
          ) : (
            <img src={user.image || "/default-avatar.jpg"} alt={user.name} className="employeeP-image" />
          )}
        </div>

        <div className="profile-details">
          {isEditing ? (
            <>
              <input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} />
              <input type="email" name="email" value={formData.email || ""} onChange={handleInputChange} />
              <input type="text" name="role" value={formData.role || ""} onChange={handleInputChange} />
              <input type="date" name="birthdate" value={formData.birthdate || ""} onChange={handleInputChange} />
              <input type="text" name="phone_number" value={formData.phone_number || ""} onChange={handleInputChange} />
            </>
          ) : (
            <>
              <h3>{user.name}</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role}</p>
              <p><strong>Fecha de Nacimiento:</strong> {user.birthdate}</p>
              <p><strong>Teléfono:</strong> {user.phone_number}</p>
            </>
          )}
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="saveProfile-btn" onClick={handleSave}><FaSave /> Guardar</button>
              <button className="cancelProfile-btn" onClick={handleCancelEdit}><FaTimes /> Cancelar</button>
            </>
          ) : (
            <button className="editProfile-btn" onClick={() => setIsEditing(true)}><FaEdit /> Editar</button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProfileView;
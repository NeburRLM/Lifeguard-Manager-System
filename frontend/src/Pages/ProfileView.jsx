import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import "./ProfileView.css";

function ProfileView() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  ////
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    const [error, setError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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


  const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswordData({ ...passwordData, [name]: value });
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            const token = sessionStorage.getItem("Token");
            const response = await fetch(`http://localhost:4000/employee/change-password/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);  // Lanzamos el error con el mensaje recibido
            }

            alert("Contraseña actualizada con éxito");
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            setError(error.message);  // Aquí guardamos el mensaje de error para mostrarlo en el UI
        }
    };

    const handleCancelPasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setError(""); // Limpiar el error cuando se cierra el modal
    };


  if (!user) return <div className="loading">Cargando...</div>;

  return (

    <div>
            <header className="header">
              <h4>Profile User</h4>
            </header>
    <div className="profile-containerP">
      <div className="profile-contentP">
        <div className="profile-image-sectionP">
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

        <div className="profile-detailsP">
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
              <p><strong>DNI:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role}</p>
              <p><strong>Fecha de Nacimiento:</strong> {user.birthdate}</p>
              <p><strong>Teléfono:</strong> {user.phone_number}</p>
            </>
          )}
        </div>

        <div className="profile-actionsP">
          {isEditing ? (
            <div className="edit-actionsP">
                <button className="saveProfile-btn" onClick={handleSave}><FaSave /> Guardar</button>
                <button className="cancelProfile-btn" onClick={handleCancelEdit}><FaTimes /> Cancelar</button>
            </div>
          ) : (
            <>
            <button className="editProfile-btn" onClick={() => setIsEditing(true)}><FaEdit /> Editar</button>
            <button className="changePassword-btn" onClick={() => setShowPasswordModal(true)}><FaKey /> Cambiar Contraseña</button>
            </>
          )}
        </div>
      </div>
    </div>

     {showPasswordModal && (
             <div className="password-modalP">
               <div className="modal-contentProfile">
                 <h3>Cambiar Contraseña</h3>
                 {error && <p className="error-textP">{error}</p>}
                 <div className="input-groupP">
                   <label htmlFor="currentPassword">Contraseña actual</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showCurrentPassword ? "text" : "password"}
                       name="currentPassword"
                       placeholder="Contraseña actual"
                       value={passwordData.currentPassword}
                       onChange={handlePasswordChange}
                     />
                     <button
                       type="button"
                       className="toggle-password"
                       onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                     >
                       {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                     </button>
                   </div>
                 </div>
                 <div className="input-groupP">
                   <label htmlFor="newPassword">Nueva contraseña</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showNewPassword ? "text" : "password"}
                       name="newPassword"
                       placeholder="Nueva contraseña"
                       value={passwordData.newPassword}
                       onChange={handlePasswordChange}
                     />
                     <button
                       type="button"
                       className="toggle-password"
                       onClick={() => setShowNewPassword(!showNewPassword)}
                     >
                       {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                     </button>
                   </div>
                 </div>
                 <div className="input-groupP">
                   <label htmlFor="confirmNewPassword">Confirmar nueva contraseña</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showConfirmNewPassword ? "text" : "password"}
                       name="confirmNewPassword"
                       placeholder="Confirmar nueva contraseña"
                       value={passwordData.confirmNewPassword}
                       onChange={handlePasswordChange}
                     />
                     <button
                       type="button"
                       className="toggle-password"
                       onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                     >
                       {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                     </button>
                   </div>
                 </div>
                 <div className="modal-buttonsP">
                   <button className="saveProfile-btn" onClick={handleChangePassword}>
                     <FaSave /> Guardar
                   </button>
                   <button className="cancelProfile-btn" onClick={handleCancelPasswordModal}>
                     <FaTimes /> Cancelar
                   </button>
                 </div>
               </div>
             </div>
           )}
    </div>
  );
}

export default ProfileView;


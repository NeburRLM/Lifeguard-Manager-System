import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import "./ProfileView.css";

function ProfileView() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [roles, setRoles] = useState([]);
  ////
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [error, setError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const { t, i18n } = useTranslation();

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
      fetch("http://localhost:4000/roles-types")
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("Roles cargados: ", data);
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
    setFormData((prevData) => ({
      ...prevData,
      image: "",
      previewImage: null,
      file: null
    }));

    // También resetear el input file (esto requiere referencia)
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
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
        alert(t("profile-view.fields-required"));
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
            setError(t("profile-view.password-no-match"));
            return;
        }

        try {
            const token = sessionStorage.getItem("Token");
            const response = await fetch(`http://localhost:4000/employee/change-password/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    'Accept-Language': i18n.language
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

            alert(t("profile-view.password-update-ok"));
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (error) {
            console.error(t("profile-view.password-update-error"), error);
            setError(error.message);  // Aquí guardamos el mensaje de error para mostrarlo en el UI
        }
    };

    const handleCancelPasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setError(""); // Limpiar el error cuando se cierra el modal
    };


  if (!user) return <div className="loading">{t("profile-view.loading")}</div>;

  return (

    <div>
            <header className="header">
              <h4>{t("profile-view.title")}</h4>
            </header>
    <div className="profile-containerP">
      <div className="profile-contentP">
        <div className="profile-image-sectionP">
          {isEditing ? (
            <>
              <label htmlFor="file-upload" className="custom-file-upload">
                {t("profile-view.select-image")}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={handleFileChange}
              />
              <img
                src={formData.previewImage || formData.image || "/default-avatar.jpg"}
                alt="Employee"
                className="employeeP-image"
              />
              {(formData.image || formData.previewImage) && (
                <button className="deleteProfile-image-btn" onClick={handleDeleteImage}>
                  {t("profile-view.delete-image")}
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
              <select name="role" value={formData.role || ""} onChange={handleInputChange} className="select-profile">
                <option value="">{t("profile-view.select-role")}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.type}>
                    {t(`roles.${role.type}`, role.type)}
                  </option>
                ))}
              </select>

              <input type="date" name="birthdate" value={formData.birthdate || ""} onChange={handleInputChange} />
              <input type="text" name="phone_number" value={formData.phone_number || ""} onChange={handleInputChange} />
            </>
          ) : (
            <>
              <h3>{user.name}</h3>
              <p><strong>{t("profile-view.dni")}</strong> {user.id}</p>
              <p><strong>{t("profile-view.email")}</strong> {user.email}</p>
              <p><strong>{t("profile-view.role")}</strong> {t(`roles.${user.role}`, user.role)}</p>
              <p><strong>{t("profile-view.birthdate")}</strong> {user.birthdate}</p>
              <p><strong>{t("profile-view.number")}</strong> {user.phone_number}</p>
            </>
          )}
        </div>

        <div className="profile-actionsP">
          {isEditing ? (
            <div className="edit-actionsP">
                <button className="saveProfile-btn" onClick={handleSave}><FaSave /> {t("profile-view.save")}</button>
                <button className="cancelProfile-btn" onClick={handleCancelEdit}><FaTimes /> {t("profile-view.cancel")}</button>
            </div>
          ) : (
            <>
            <button className="editProfile-btn" onClick={() => setIsEditing(true)}><FaEdit /> {t("profile-view.edit")}</button>
            <button className="changePassword-btn" onClick={() => setShowPasswordModal(true)}><FaKey /> {t("profile-view.change-password")}</button>
            </>
          )}
        </div>
      </div>
    </div>

     {showPasswordModal && (
             <div className="password-modalP">
               <div className="modal-contentProfile">
                 <h3>{t("profile-view.change-password")}</h3>
                 {error && <p className="error-textP">{error}</p>}
                 <div className="input-groupP">
                   <label htmlFor="currentPassword">{t("profile-view.current-password")}</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showCurrentPassword ? "text" : "password"}
                       name="currentPassword"
                       placeholder={t("profile-view.current-password")}
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
                   <label htmlFor="newPassword">{t("profile-view.new-password")}</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showNewPassword ? "text" : "password"}
                       name="newPassword"
                       placeholder={t("profile-view.new-password")}
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
                   <label htmlFor="confirmNewPassword">{t("profile-view.confirm-password")}</label>
                   <div className="password-input-wrapper">
                     <input
                       type={showConfirmNewPassword ? "text" : "password"}
                       name="confirmNewPassword"
                       placeholder={t("profile-view.confirm-password")}
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
                     <FaSave /> {t("profile-view.save")}
                   </button>
                   <button className="cancelProfile-btn" onClick={handleCancelPasswordModal}>
                     <FaTimes /> {t("profile-view.cancel")}
                   </button>
                 </div>
               </div>
             </div>
           )}
    </div>
  );
}

export default ProfileView;


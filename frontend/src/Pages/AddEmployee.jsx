import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(""); // Estado para manejar los errores
  const { t } = useTranslation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Limpiar el error cuando el usuario cambia algún campo
    e.target.setCustomValidity("");
  };

 useEffect(() => {
     fetch("http://localhost:4000/roles-types")
       .then((response) => response.json())
       .then((data) => {
         if (Array.isArray(data)) {
           setRoles(data); // Actualizar el estado con los roles obtenidos
         } else {
           setError(t("add-employee.role-error"));
         }
       })
       .catch((error) => {
         console.error("Error al obtener los roles:", error);
         setError(t("add-employee.role-error"));
       });
   }, [t]);


    const validateField = (input) => {
      if (input.name === "id") {
        const dniPattern = /^[0-9]{8}[A-Za-z]{1}$/; // 8 números seguidos de 1 letra
        if (!dniPattern.test(input.value)) {
          input.setCustomValidity(t("add-employee.error-dni"));
        } else {
          input.setCustomValidity(""); // Validación exitosa
        }
      } else if (input.name === "role" && input.value === "") {
        input.setCustomValidity(t("add-employee.select-role-error"));
      } else if (!input.validity.valid) {
        input.setCustomValidity(t("add-employee.error-required")); // Mensaje genérico si falta el campo
      } else {
        input.setCustomValidity(""); // Validación exitosa
      }
    };

  const handleSubmit = (e) => {
    e.preventDefault();

        const form = e.target;
        const inputs = form.querySelectorAll("input, select");
        let formIsValid = true;

        inputs.forEach((input) => {
          validateField(input);
          if (!input.checkValidity()) {
            formIsValid = false;
          }
        });

        if (!formIsValid) {
          form.reportValidity(); // Muestra los mensajes de error personalizados
          return;
        }

    // Validación del formato del DNI
    const dniPattern = /^[0-9]{8}[A-Za-z]{1}$/; // 8 números seguidos de 1 letra
    if (!dniPattern.test(formData.id)) {
      setError(t("add-employee.error-dni"));
      return; // Si no es válido, no enviamos la solicitud
    }

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
          return response.json(); // Si la respuesta no es exitosa, parseamos la respuesta JSON
        }
        return response.json(); // Si la respuesta es exitosa, procesamos el JSON
      })
      .then((data) => {
        console.log("Respuesta del servidor:", data); // Verifica qué contiene data en la consola
        if (data.status === "Success") {
          // Si todo ha ido bien, mostramos un mensaje de éxito
          alert(t("add-employee.add-ok"));
          // Redirigimos al usuario a la página de empleados
          navigate("/employees");
        } else {
          // Si hay algún error específico en la respuesta, lo mostramos
          console.log("Error específico:", data.message); // Verifica el mensaje de error recibido
          if (data.message.includes("DNI")) {
            setError(t("add-employee.dni-exist"));
          } else if (data.message.includes("correo")) {
            setError(t("add-employee.email-exist"));
          } else {
            setError(data.message || t("add-employee.error-add"));
          }
        }
      })
      .catch((error) => {
        console.log("Error al agregar empleado:", error);
        // Aquí también manejamos el caso de error de la solicitud
        setError(t("add-employee.error-add"));
      });
  };


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(""); // Limpia el error después de 5 segundos
      }, 5000);

      return () => clearTimeout(timer); // Limpia el timer si el componente se desmonta
    }
  }, [error]);

  // Función para manejar el botón de cancelar
  const handleCancel = () => {
    navigate(-1); // Regresa a la página anterior sin agregar un empleado
  };

  return (
    <div className="add-employee-container">
      <h2>{t("add-employee.title")}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("add-employee.id")}</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
          {error && error.includes("DNI") && (
            <div className="error-message">{error}</div>
          )}
        </div>
        <div className="form-group">
          <label>{t("add-employee.name")}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
          {error && error.includes("Todos los campos") && (
            <div className="error-message">{error}</div>
          )}
        </div>
        <div className="form-group">
          <label>{t("add-employee.role")}</label>
          <div className="content-selectAdd">
            <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                onInvalid={(e) => validateField(e.target)}
                required
            >
              <option value="">{t("add-employee.select-role")}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.type}>
                  {role.type}
                </option>
              ))}
            </select>
          </div>

          {error && error.includes("Todos los campos") && (
            <div className="error-message">{error}</div>
          )}
        </div>
        <div className="form-group">
          <label>{t("add-employee.email")}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
          {error && error.includes("correo") && (
            <div className="error-message">{error}</div>
          )}
        </div>
        <div className="form-group">
          <label>{t("add-employee.birthdate")}</label>
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
        </div>
        <div className="form-group">
          <label>{t("add-employee.number")}</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            onInvalid={(e) => validateField(e.target)}
            required
          />
        </div>
        <div className="button-group">
          <button type="submit" className="submit-button">{t("add-employee.add-employee")}</button>
          <button type="button" className="cancel-button" onClick={handleCancel}>
            {t("add-employee.cancel")}
          </button>
        </div>
      </form>
      {error && !error.includes("DNI") && !error.includes("correo") && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
};

export default AddEmployee;

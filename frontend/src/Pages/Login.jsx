import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (sessionStorage.getItem("Token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const validateInput = (input) => {
    if (input.validity.valueMissing) {
      if (input.name === "id") {
        input.setCustomValidity(t("login.error-dni-required")); // Mensaje personalizado para DNI
      } else if (input.name === "password") {
        input.setCustomValidity(t("login.error-password-required")); // Mensaje personalizado para contraseña
      }
    } else {
      input.setCustomValidity(""); // Resetea el mensaje de error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Resetear errores anteriores

    const form = e.target;
    const inputs = form.querySelectorAll("input");
    let formIsValid = true;

    inputs.forEach((input) => {
      validateInput(input); // Valida cada input manualmente
      if (!input.checkValidity()) {
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      form.reportValidity(); // Muestra los mensajes de error nativos
      return; // Detener el envío si el formulario no es válido
    }

    try {
      const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("Token", data.Token);
        sessionStorage.setItem("userId", id); // Guarda el ID del usuario
        navigate("/dashboard", { replace: true }); // Redirige a la página principal del sistema
        setTimeout(() => {
          window.history.pushState(null, "", "/dashboard");
        }, 100);
      } else {
        // Manejo de errores del servidor
        if (data.message === "Empleado no encontrado.") {
          setError(t("login.error-employee"));
        } else if (data.message === "Error, la contraseña no es correcta.") {
          setError(t("login.error-password"));
        } else if (data.message === "No tienes acceso al sistema.") {
          setError(t("login.error-access"));
        } else {
          setError(t("login.error"));
        }
      }
    } catch (error) {
      setError(t("login.error"));
    }
  };

  return (
    <div className="login-container">
      <div className="language-selector">
        <select onChange={(e) => i18n.changeLanguage(e.target.value)} value={i18n.language}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ca">Català</option>
        </select>
        <img
          src={`/flags/${i18n.language === "en" ? "gb" : i18n.language}.png`}
          alt="flag"
          className="flag-icon"
        />
      </div>

      <div className="login-card">
        <h2>{t("login.welcome")}</h2>
        <p>{t("login.subtitle")}</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="id">{t("login.dni")}</label>
            <input
              type="text"
              id="id"
              name="id"
              className="dni-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onInvalid={(e) => validateInput(e.target)}
              onInput={(e) => e.target.setCustomValidity("")}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("login.password")}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInvalid={(e) => validateInput(e.target)}
                onInput={(e) => e.target.setCustomValidity("")}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>

          <div className="form-footer">
            <a href="/forgot-password" className="forgot-password-link">
              {t("login.forgot")}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
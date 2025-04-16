import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

 useEffect(() => {
     if (sessionStorage.getItem("Token")) {
       navigate("/dashboard");
     }
   }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Resetear errores anteriores

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
        //localStorage.setItem("Token", data.Token);
        sessionStorage.setItem("Token", data.Token);
        sessionStorage.setItem("userId", id); // Guarda el ID del usuario
        navigate("/dashboard", { replace: true }); // Redirige a la página principal del sistema
        setTimeout(() => {
            window.history.pushState(null, "", "/dashboard");
        }, 100);
      } else {
        setError(data.message || "Error al iniciar sesión.");
      }
    } catch (error) {
      setError("Error de conexión con el servidor.");
    }
  };

  return (
      <div className="login-container">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p>Please login to your account</p>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="id">DNI</label>
              <input
                type="text"
                id="id"
                name="id"
                className="dni-input"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  };

export default Login;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
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
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
          <div className="form-footer">
            <a href="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </a>
            <p>
              Don't have an account?{" "}
              <a href="/register" className="register-link">
                Register
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

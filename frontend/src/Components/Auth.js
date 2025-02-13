import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // 📌 Instala con: npm install jwt-decode

// Guardar el token en localStorage
/*export const setToken = (token) => {
  localStorage.setItem("Token", token); //localStorage o sessionStorage
};*/
export const setToken = (token) => {
  sessionStorage.setItem("Token", token); // Usa sessionStorage
};

// Obtener el token desde localStorage
/*export const getToken = () => {
  return localStorage.getItem("Token");
};*/
export const getToken = () => {
  return sessionStorage.getItem("Token");
};
// Componente para proteger rutas
export function RequireToken({ children }) {
  let auth = getToken(); // Verificamos si hay un token
  let location = useLocation();

  if (!auth) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  try {
          const decoded = jwtDecode(auth);
          const currentTime = Date.now() / 1000; // Convertir a segundos

          if (decoded.exp < currentTime) {
              // Si el token expiró, redirigir al login
              sessionStorage.removeItem("Token");
              return <Navigate to="/" state={{ from: location }} replace />;
          }
      } catch (error) {
          console.error("Error al decodificar el token:", error);
          sessionStorage.removeItem("Token");
          return <Navigate to="/" state={{ from: location }} replace />;
      }

  return children;
}

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

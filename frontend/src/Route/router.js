import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Dashboard from "../Pages/Dashboard";
import ManageEmployees from "../Pages/ManageEmployees";
import { RequireToken } from "../Components/Auth"; // Importamos la autenticación

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <RequireToken><Dashboard /></RequireToken>, // ✅ CORRECTO
  },
  {
      path: "/employees",
      element: <RequireToken><ManageEmployees /></RequireToken>, // Protegemos la ruta
    },
]);

export default router;

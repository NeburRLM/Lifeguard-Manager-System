import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Dashboard from "../Pages/Dashboard";
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
]);

export default router;

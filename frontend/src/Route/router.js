import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Dashboard from "../Pages/Dashboard";
import ManageEmployees from "../Pages/ManageEmployees";
import { RequireToken } from "../Components/Auth"; // Importamos la autenticación
import EmployeeView from "../Pages/EmployeeView";
import ScheduleView from "../Pages/ScheduleView";

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
  {
      path: "/employeeview/:id", // Ruta para ver el empleado, con parámetro `id`
      element: <RequireToken><EmployeeView /></RequireToken>, // Protegemos la ruta
  },
  {
      path: "/employeeview/:id/schedule/:scheduleId", // Ruta para ver el empleado, con parámetro `id`
      element: <RequireToken><ScheduleView /></RequireToken>, // Protegemos la ruta
  },

]);

export default router;

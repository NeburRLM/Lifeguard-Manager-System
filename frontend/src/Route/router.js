import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Dashboard from "../Pages/Dashboard";
import ManageEmployees from "../Pages/ManageEmployees";
import { RequireToken } from "../Components/Auth"; // Importamos la autenticación
import EmployeeView from "../Pages/EmployeeView";
import ScheduleView from "../Pages/ScheduleView";
import AddEmployee from "../Pages/AddEmployee";
import AddFacility from "../Pages/AddFacility";
import ManageFacilities from "../Pages/ManageFacilities";
import FacilityView from "../Pages/FacilityView"
import ManagePayrolls from "../Pages/ManagePayrolls"
import PayrollsView from "../Pages/PayrollsView"
import PayrollView from "../Pages/PayrollView"

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
  {
      path: "/createEmployee", // Ruta para agregar un nuevo empleado
      element: <RequireToken><AddEmployee /></RequireToken>, // Protegemos la ruta
   },
   {
      path: "/facilities", // Ruta para agregar un nuevo empleado
      element: <RequireToken><ManageFacilities /></RequireToken>, // Protegemos la ruta
   },
   {
      path: "/facilityview/:id", // Ruta para ver el empleado, con parámetro `id`
      element: <RequireToken><FacilityView /></RequireToken>, // Protegemos la ruta
   },
   {
         path: "/createFacility", // Ruta para agregar un nuevo empleado
         element: <RequireToken><AddFacility /></RequireToken>, // Protegemos la ruta
   },
   {
         path: "/payrolls",
         element: <RequireToken><ManagePayrolls /></RequireToken>, // Protegemos la ruta
     },
      {
           path: "/payrollsview/:id", // Ruta para ver el empleado, con parámetro `id`
           element: <RequireToken><PayrollsView /></RequireToken>, // Protegemos la ruta
       },
       {
                  path: "/payrollsview/:id/payroll/:payrollId", // Ruta para ver el empleado, con parámetro `id`
                  element: <RequireToken><PayrollView /></RequireToken>, // Protegemos la ruta
              },

]);

export default router;

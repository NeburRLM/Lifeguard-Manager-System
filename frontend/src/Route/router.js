import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import ForgotPassword from "../Pages/ForgotPassword";
import ResetPassword from '../Pages/ResetPassword';
import Dashboard from "../Pages/Dashboard";
import ManageEmployees from "../Pages/ManageEmployees";
import { RequireToken } from "../Components/Auth"; // Importamos la autenticación
import Layout from "../Components/Layout";
import EmployeeView from "../Pages/EmployeeView";
import ScheduleView from "../Pages/ScheduleView";
import AddEmployee from "../Pages/AddEmployee";
import AddFacility from "../Pages/AddFacility";
import ManageFacilities from "../Pages/ManageFacilities";
import FacilityView from "../Pages/FacilityView"
import ManagePayrolls from "../Pages/ManagePayrolls"
import PayrollsView from "../Pages/PayrollsView"
import PayrollView from "../Pages/PayrollView"
import ManageIncidents from "../Pages/ManageIncidents"
import IncidentView from "../Pages/IncidentView"
import ProfileView from "../Pages/ProfileView"
import IncidentAnalysisView from "../Pages/IncidentAnalysisView"
import CurrentAttendance from "../Pages/CurrentAttendance"


const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
      path: "/forgot-password", // Aquí agregamos la ruta para "Forgot Password"
      element: <ForgotPassword />, // Componente que muestra el formulario de recuperación
    },
    {
          path: "/reset-password", // Aquí agregamos la ruta para "Forgot Password"
          element: <ResetPassword />, // Componente que muestra el formulario de recuperación
        },

  {
    path: "/",
    element: <RequireToken><Layout /></RequireToken>,
    children: [
        {
            path: "dashboard",
            element: <Dashboard />
        },
        {
            path: "current_attendance",
            element: <CurrentAttendance />
        },
        {
              path: "employees",
              element: <ManageEmployees />
        },
        {
              path: "employeeview/:id",
              element: <EmployeeView />
        },
        {
              path: "employeeview/:id/schedule/:scheduleId",
              element: <ScheduleView />
        },
        {
              path: "createEmployee",
              element: <AddEmployee />
         },
         {
              path: "facilities",
              element: <ManageFacilities />
         },
         {
              path: "facilityview/:id",
              element: <FacilityView />
         },
         {
              path: "createFacility",
              element: <AddFacility />
         },
         {
              path: "payrolls",
              element: <ManagePayrolls />
         },
         {
              path: "payrollsview/:id",
              element: <PayrollsView />
         },
         {
              path: "payrollsview/:id/payroll/:payrollId",
              element: <PayrollView />
         },
         {
              path: "incidents",
              element: <ManageIncidents />
         },
         {
              path: "incidentview/:id",
              element: <IncidentView />
         },
         {
              path: "incident-analysis",
              element: <IncidentAnalysisView />
         },
         {
              path: "profile",
              element: <ProfileView />
         }
    ]
  },

]);

export default router;

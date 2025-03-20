import { createBrowserRouter } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
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
import ProfileView from "../Pages/ProfileView"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
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
              path: "profile",
              element: <ProfileView />
         }
    ]
  },

]);

export default router;

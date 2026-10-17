import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/screens/Login";
import OtpVerification from "@/screens/OtpVerification";
import WeeklyTasks from "@/screens/WeeklyTasks/WeeklyTasksScreen";
import Today from "@/screens/Today";
import MentionsInbox from "@/screens/MentionsInbox/index";
import PersonalDashboard from "@/screens/PersonalDashboard";
import { Settings } from "@/screens/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/login/otp",
    element: <OtpVerification />
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/tasks/weekly", element: <WeeklyTasks /> },
          { path: "/today", element: <Today /> },
          { path: "/mentions", element: <MentionsInbox /> },
          { path: "/dashboard", element: <PersonalDashboard /> },
          { path: "/settings", element: <Settings /> },
          { path: "/", element: <Navigate to="/today" replace /> },
          { path: "*", element: <Navigate to="/today" replace /> }
        ]
      }
    ]
  }
]);

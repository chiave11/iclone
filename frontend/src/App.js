import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import CalendarPage from "./pages/CalendarPage";
import Notes from "./pages/Notes";
import { Toaster } from "./components/ui/sonner";

const Protected = ({ children }) => {
  const { profile, loaded } = useApp();
  if (!loaded) return null;
  if (!profile.completedOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
};

const OnboardingGate = () => {
  const { profile, loaded } = useApp();
  if (!loaded) return null;
  if (profile.completedOnboarding) return <Navigate to="/" replace />;
  return <Onboarding />;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<OnboardingGate />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="notes" element={<Notes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

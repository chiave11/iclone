import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import CalendarPage from "./pages/CalendarPage";
import Notes from "./pages/Notes";
import Coach from "./pages/Coach";
import NotificationManager from "./components/NotificationManager";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { Toaster } from "./components/ui/sonner";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6b6659]">Caricamento...</div>;
  if (!user) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  return children;
};

const OnboardingGate = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.completedOnboarding) return <Navigate to="/" replace />;
  return <Onboarding />;
};

const MainGate = () => {
  const { user } = useAuth();
  if (!user.completedOnboarding) return <Navigate to="/onboarding" replace />;
  return <Layout />;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <NotificationManager />
          <PWAInstallPrompt />
          <Routes>
            <Route path="/auth/login" element={<AuthPage mode="login" />} />
            <Route path="/auth/register" element={<AuthPage mode="register" />} />
            <Route path="/onboarding" element={<OnboardingGate />} />
            <Route
              path="/"
              element={<RequireAuth><MainGate /></RequireAuth>}
            >
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<Notes />} />
              <Route path="coach" element={<Coach />} />
              <Route path="coach/:kind" element={<Coach />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

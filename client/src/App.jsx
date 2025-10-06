import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { routes } from "@utils/routes/routeConfig.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AuthGate from "@view/layout/AuthGate";
import ProfileGate from "@view/layout/ProfileGate";

import HomePage from "@view/HomePage";
import Auth from "@view/auth";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🌍 Public routes — no AuthGate */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/*" element={<Auth />} />

        {/* 🔐 Protected routes */}
        {routes.map(({ path, element, roles }) =>
          roles.includes("all") ? (
            <Route
              key={path}
              path={path}
              element={<PublicRoute element={element} />}
            />
          ) : (
            <Route
              key={path}
              path={path}
              element={
                <AuthGate>
                  <ProfileGate>
                    <ProtectedRoute
                      element={element}
                      allowedRoles={Array.isArray(roles) ? roles : [roles]}
                    />
                  </ProfileGate>
                </AuthGate>
              }
            />
          )
        )}
      </Routes>
    </Router>
  );
}

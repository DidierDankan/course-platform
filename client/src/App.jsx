import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { routes } from "@utils/routes/routeConfig.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AuthGate from "@view/layout/AuthGate";
import ProfileGate from "@view/layout/ProfileGate";

import HomePage from "@view/HomePage";
import Auth from "@view/auth";
import Header from "@components/ui/Header"; // always visible

export default function App() {
  return (
    <Router>
      {/* ✅ Global user hydration wrapper */}
      <AuthGate>
        <Header />

        <Routes>
          {/* 🌍 Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/*" element={<Auth />} />

          {/* 🔐 Protected routes */}
          {routes.map(({ path, element, roles, publicOnly }) => {
            // ✅ truly public route
            if (roles.includes("all") && !publicOnly) {
              return <Route key={path} path={path} element={element} />;
            }

            // ✅ public-only route (login/register)
            if (roles.includes("all") && publicOnly) {
              return <Route key={path} path={path} element={<PublicRoute element={element} />} />;
            }

            // 🔐 protected route
            return (
              <Route
                key={path}
                path={path}
                element={
                  <ProfileGate>
                    <ProtectedRoute element={element} allowedRoles={roles} />
                  </ProfileGate>
                }
              />
            );
          })}
        </Routes>
      </AuthGate>
    </Router>
  );
}

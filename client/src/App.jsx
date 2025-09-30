import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from '@utils/routes/routeConfig.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AuthGate from '@view/layout/AuthGate';
import ProfileGate from '@view/layout/ProfileGate';

export default function App() {
  return (
    <Router>
      <AuthGate>
        <ProfileGate>
          <Routes>
            {routes.map(({ path, element, roles }) => {
              if (roles.includes("all")) {
                return (
                  <Route
                    key={path}
                    path={path}
                    element={<PublicRoute element={element} />}
                  />
                );
              }

              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute
                      element={element}
                      allowedRoles={Array.isArray(roles) ? roles : [roles]}
                    />
                  }
                />
              );
            })}
          </Routes>
        </ProfileGate>
      </AuthGate>
    </Router>
  );
}

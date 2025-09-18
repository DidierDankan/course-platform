import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from '@utils/routes/routeConfig.jsx'
import ProtectedRoute from './components/ProtectedRoute';
import ProfileFetch from '@view/layout/ProfileFetch';

export default function App() {
  return (
    <Router>
      <ProfileFetch>
        <Routes>
          {routes.map(({ path, element, roles }) => {
            if (roles.includes('all')) {
              return <Route key={path} path={path} element={element} />;
            }

            return (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute
                    element={element}
                    allowedRoles={Array.isArray(roles) ? roles : [roles]} // You can pass an array of roles
                  />
                }
              />
            );
          })}
        </Routes>
      </ProfileFetch>
    </Router>
  );
}
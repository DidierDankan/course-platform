import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from '@utils/routes/routeConfig.jsx'
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
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
                  allowedRoles={[roles]} // You can pass an array of roles
                />
              }
            />
          );
        })}
      </Routes>
    </Router>
  );
}
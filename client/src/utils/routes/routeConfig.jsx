import Landing from '@view/Landing';
import Register from '@view/auth/Register';
import Login from '@view/auth/Login';
import Welcome from '@view/profile/Welcome';
import Edit from '@view/profile/edit';
import PortfolioPage from '@view/profile/Porfolio';
import RequireProfileCompletion from '@components/ui/RequireProfileCompletion';

export const routes = [
  {
    path: '/',
    element: <Landing />,
    roles: ['all'], // accessible to everyone
  },
  {
    path: '/register',
    element: <Register />,
    roles: ['all'],
  },
  {
    path: '/login',
    element: <Login />,
    roles: ['all'],
  },
  {
    path: '/profile/welcome',
    element: (
      <RequireProfileCompletion>
        <Welcome />
      </RequireProfileCompletion>
    ),
    roles: ['admin', 'seller', 'user'], // protected route for logged-in users
  },
  {
    path: '/profile/edit',
    element: <Edit />,
    roles: ['admin', 'seller', 'user'],
  },
  {
    path: '/profile/portfolio',
    element: (
      <RequireProfileCompletion>
        <PortfolioPage />
      </RequireProfileCompletion>
    ),
    roles: ['admin', 'seller'], // only allow sellers/admins to manage courses
  },
];

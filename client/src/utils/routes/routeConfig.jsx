import Register from '@view/auth/Register';
import Login from '@view/auth/Login';
import Welcome from '@view/profile/Welcome';
import Edit from '@view/profile/edit';
import PortfolioPage from '@view/profile/Porfolio';
import RequireProfileCompletion from '@components/ui/RequireProfileCompletion';

export const routes = [
  {
    path: '/auth/register',
    element: <Register />,
    roles: ['all'],
  },
  {
    path: '/auth/login',
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
    roles: ['admin', 'seller', 'user'],
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
    roles: ['admin', 'seller'],
  },
];

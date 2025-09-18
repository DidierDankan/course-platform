import Landing from '@view/Landing';
import Register from '@view/auth/Register';
import Login from '@view/auth/Login';
import Welcome from '@view/profile/Welcome';
import Edit from '@view/profile/edit';
import RequireProfileCompletion from '@components/ui/RequireProfileCompletion';

// Add your views here as needed

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
    roles: ['admin', 'seller','user'], // protected route for logged-in users
  },
  {
    path: '/profile/edit',
    element: (
      <Edit />
    ),
    roles: ['admin', 'seller','user'], // protected route for logged-in users
  },
];
import Register from '@view/auth/Register';
import Login from '@view/auth/Login';
import Welcome from '@view/profile/Welcome';
import Edit from '@view/profile/edit';
import PortfolioPage from '@view/profile/Porfolio';
import RequireProfileCompletion from '@components/ui/RequireProfileCompletion';
import UserWelcome from '@view/user/Welcome'
import WatchCourse from '@view/user/WhatchCourse';
import PaymentSuccess from '@view/payment/PaymentSuccess';
import PaymentCancel from '@view/payment/PaymentCancel';
import CoursePreview from '@view/courses/CoursePreview';
import BrowseCourses from '@view/courses/BrowseCourses';
import MyCourses from '@view/user/MyCourses';
import SellerPublic from '@view/public/SellerPublic';
import FavoritesPage from '@view/user/Favorites';

export const routes = [
  {
    path: '/auth/register',
    element: <Register />,
    roles: ['all'],
    publicOnly: true
  },
  {
    path: '/auth/login',
    element: <Login />,
    roles: ['all'],
    publicOnly: true
  },
  {
    path: "/courses/:id",
    element: <CoursePreview />,
    roles: ["all"],
  },
   {
    path: "/payment/cancel",
    element: <PaymentCancel />,
    roles: ["all"], // can be public if you want
  },
  {
    path: "/courses",
    element: <BrowseCourses />,
    roles: ["all"],
  },
  {
    path: "/sellers/:sellerId",
    element: <SellerPublic />,
    roles: ["all"],
  },
  {
    path: '/profile/dashboard',
    element: (
      <RequireProfileCompletion>
        <Welcome />
      </RequireProfileCompletion>
    ),
    roles: ['admin', 'seller'],
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
  {
    path: '/profile/edit',
    element: <Edit />,
    roles: ['admin', 'seller', 'user'],
  },
  {
    path: '/user/dashboard',
    element: <UserWelcome />,
    roles: ['admin', 'user'],
  },
  {
    path: '/user/courses',
    element: <MyCourses />,
    roles: ['admin', 'user'],
  },
  {
    path: "/user/favorites",
    element: <FavoritesPage />,
    roles: ["admin", "user"],
  },
  {
    path: "/courses/:id/watch",
    element: <WatchCourse />,
    roles: ["admin", "user", "seller"], // any enrolled user/seller can watch
  },
  {
    path: "/payment/success",
    element: <PaymentSuccess />,
    roles: ["user", "seller", "admin"], // must be logged in (checkout uses customer)
  },
];

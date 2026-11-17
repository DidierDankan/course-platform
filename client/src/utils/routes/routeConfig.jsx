import { lazy } from "react";
import RequireProfileCompletion from "@components/ui/RequireProfileCompletion";

// Every page is its own chunk, downloaded the first time someone opens it (App.jsx shows one fallback meanwhile), so the
// first visit doesn't download every page, Formik, Yup, the charts and the carousel. Home is not here: it's imported
// directly in App.jsx because it's the landing page, and a lazy Home would add a round trip before its hero shows.
const Register = lazy(() => import("@view/auth/Register"));
const Login = lazy(() => import("@view/auth/Login"));
const Welcome = lazy(() => import("@view/profile/Welcome"));
const Edit = lazy(() => import("@view/profile/Edit"));
const PortfolioPage = lazy(() => import("@view/profile/Porfolio"));
const Notifications = lazy(() => import("@view/profile/Notifications"));
const UserWelcome = lazy(() => import("@view/user/Welcome"));
const WatchCourse = lazy(() => import("@view/user/WhatchCourse"));
const PaymentSuccess = lazy(() => import("@view/payment/PaymentSuccess"));
const PaymentCancel = lazy(() => import("@view/payment/PaymentCancel"));
const CoursePreview = lazy(() => import("@view/courses/CoursePreview"));
const BrowseCourses = lazy(() => import("@view/courses/BrowseCourses"));
const MyCourses = lazy(() => import("@view/user/MyCourses"));
const SellerPublic = lazy(() => import("@view/public/SellerPublic"));
const FavoritesPage = lazy(() => import("@view/user/Favorites"));
const StyleGuide = lazy(() => import("@view/public/StyleGuide"));

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
    path: "/styleguide",
    element: <StyleGuide />,
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
    path: '/profile/notifications',
    element: <Notifications />,
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

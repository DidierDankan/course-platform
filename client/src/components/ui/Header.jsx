import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "@api/modules/authApi";
import { logout as logoutAction } from "@store/slices/authSlice";
import { ShoppingCart } from "lucide-react";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch(logoutAction());
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-[var(--header-height)] z-50 bg-gradient-to-r from-[var(--color-primary)] via-[#6d28d9] to-[var(--color-primary-light)] shadow-lg">
      <nav className="max-w-6xl mx-auto h-full px-6 flex justify-between items-center text-white">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-[var(--color-text-white)] text-2xl font-extrabold tracking-tight hover:opacity-90 transition"
        >
          LearnHub
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-5 text-sm sm:text-base font-medium">
          {!isAuthenticated && (
            <>
              <Link
                to="/auth/login"
                className="text-[var(--color-text-white)] hover:text-[var(--color-text-grayshblue)] transition-colors mr-[10px]"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="text-[var(--color-text-white)] bg-white hover:bg-[var(--color-text-grayshblue)] px-[14px] py-[6px] rounded-[8px] font-semibold transition"
              >
                Join Now
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "user" && (
            <>
              <Link
                to="/user/dashboard"
                className="text-[var(--color-text-white)] hover:text-[var(--color-text-grayshblue)] transition-colors"
              >
                Dashboard
              </Link>

              <Link
                to="user/courses"
                className="relative hover:text-[var(--color-text-grayshblue)] transition-colors"
              >
                My Courses
              </Link>

              <Link
                to="user/favorites"
                className="relative hover:text-[var(--color-text-grayshblue)] transition-colors"
              >
                Favorites
              </Link>

              <button
                onClick={handleLogout}
                className="ml-[6px] text-[var(--color-text-white)] hover:text-white font-medium transition"
              >
                Logout
              </button>
            </>
          )}

          {isAuthenticated &&
            (user?.role === "seller" || user?.role === "admin") && (
              <>
                <Link
                  to="/profile/dashboard"
                  className="text-[var(--color-text-white)] hover:text-[var(--color-text-grayshblue)] transition-colors mr-[10px]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile/edit"
                  className="text-[var(--color-text-white)] hover:text-[var(--color-text-grayshblue)] transition-colors mr-[10px]"
                >
                  Edit Profile
                </Link>
                <Link
                  to="/profile/portfolio"
                  className="text-[var(--color-text-white)] hover:text-[var(--color-text-grayshblue)] transition-colors mr-[10px]"
                >
                  Portfolio
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-[6px] text-[var(--color-text-white)] hover:text-white font-medium transition"
                >
                  Logout
                </button>
              </>
            )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

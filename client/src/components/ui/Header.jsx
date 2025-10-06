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
      await logoutApi().unwrap(); // Clear server cookie/session
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch(logoutAction()); // Clear Redux state
      navigate("/"); // Redirect to homepage
    }
  };

  // --- UI ---
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          LearnHub
        </Link>

        {/* NAV LINKS */}
        <div className="flex items-center gap-4 text-sm sm:text-base">
          {!isAuthenticated && (
            <>
              <Link
                to="/auth/login"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Join Now
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "user" && (
            <>
              <Link
                to="/user/dashboard"
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>

              {/* Cart icon */}
              <Link
                to="/cart"
                className="relative hover:text-blue-600 transition-colors"
                title="Cart"
              >
                <ShoppingCart size={20} />
                {/* You can show item count later */}
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline ml-[5px]"
              >
                Logout
              </button>
            </>
          )}

          {isAuthenticated && (user?.role === "seller" || user?.role === "admin") && (
            <>
              <Link
                to="/profile/welcome"
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/profile/edit"
                className="hover:text-blue-600 transition-colors"
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/portfolio"
                className="hover:text-blue-600 transition-colors"
              >
                Portfolio
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline ml-[5px]"
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

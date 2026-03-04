import { Link, useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "@api/modules/authApi";
import { logout as logoutAction } from "@store/slices/authSlice";
import { useEffect, useState } from "react";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const navClass = ({ isActive }) => {
    const base = "transition-colors";
    const active = "text-indigo-500 font-semibold";
    const idle = scrolled
      ? "text-[#0f172a] hover:text-indigo-600"
      : "text-white hover:text-[var(--color-text-grayshblue)]";

    return `${base} ${isActive ? active : idle}`;
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full h-[var(--header-height)] z-50 transition-all duration-200
      ${
        scrolled
          ? "bg-white/70 backdrop-blur-md border-b border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          : "bg-gradient-to-r from-[var(--color-primary)] via-[#6d28d9] to-[var(--color-primary-light)] shadow-lg"
      }`}
    >
      <nav className="max-w-6xl mx-auto h-full px-6 flex justify-between items-center">

        {/* Logo */}
        <Link
          to="/"
          className={`text-2xl font-extrabold tracking-tight transition ${
            scrolled ? "text-[#0f172a]" : "text-white"
          }`}
        >
          LearnHub
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-[22px] text-sm sm:text-base font-medium">
        <NavLink to="/courses" className={navClass}>
          Browse
        </NavLink>

          {!isAuthenticated && (
            <>
              <Link
                to="/auth/login"
                className={`transition-colors ${
                  scrolled
                    ? "text-[#0f172a] hover:text-indigo-600"
                    : "text-white hover:text-[var(--color-text-grayshblue)]"
                }`}
              >
                Sign In
              </Link>

              <Link
                to="/auth/register"
                className="bg-white hover:bg-[var(--color-text-grayshblue)] px-[14px] py-[6px] rounded-[8px] font-semibold transition"
              >
                Join Now
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "user" && (
            <>
              <NavLink to="/user/dashboard" className={navClass}>
                Dashboard
              </NavLink>

              <NavLink to="/user/courses" className={navClass}>
                My Courses
              </NavLink>

              <NavLink to="/user/favorites" className={navClass}>
                Favorites
              </NavLink>

              <button
                onClick={handleLogout}
                className={`transition ${
                  scrolled
                    ? "text-[#0f172a] hover:text-red-600"
                    : "text-white hover:text-red-200"
                }`}
              >
                Logout
              </button>
            </>
          )}

          {isAuthenticated && (user?.role === "seller" || user?.role === "admin") && (
            <>
              <NavLink to="/profile/dashboard" className={navClass}>
                Dashboard
              </NavLink>

              <NavLink to="/profile/edit" className={navClass}>
                Edit Profile
              </NavLink>

              <NavLink to="/profile/portfolio" className={navClass}>
                Portfolio
              </NavLink>

              <button
                onClick={handleLogout}
                className={`transition ${
                  scrolled
                    ? "text-[#0f172a] hover:text-red-600"
                    : "text-white hover:text-red-200"
                }`}
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
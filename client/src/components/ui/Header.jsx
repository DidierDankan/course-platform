import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useLogoutMutation } from "@api/modules/authApi";
import { logout as logoutAction } from "@store/slices/authSlice";
import { useTheme } from "@hooks/useTheme";
import Logo from "@components/ui/Logo";
import { apiSlice } from "@api/apiSlice";
// Role -> header links. Server-side checks protect the pages; this only decides what to show.
const ROLE_LINKS = {
  user: [
    { to: "/user/dashboard", label: "Dashboard" },
    { to: "/user/courses", label: "My courses" },
    { to: "/user/favorites", label: "Favorites" },
  ],
  seller: [
    { to: "/profile/dashboard", label: "Dashboard" },
    { to: "/profile/edit", label: "Edit profile" },
    { to: "/profile/portfolio", label: "Portfolio" },
  ],
};
ROLE_LINKS.admin = ROLE_LINKS.seller;

const THEME_LABELS = { brutal: "Brutal", cinematic: "Cinematic" };

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "brutal" ? "cinematic" : "brutal";

  return (
    <button
      type="button"
      className="nav-link theme-toggle"
      onClick={toggleTheme}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Switch to ${THEME_LABELS[next]}`}
    >
      Theme <small>{THEME_LABELS[theme]}</small>
    </button>
  );
}

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const roleLinks = (isAuthenticated && ROLE_LINKS[user?.role]) || [];

  const handleLogout = async () => {
    close();
    try {
      await logoutApi().unwrap();
    } catch {
      // The server session may already be gone; the local logout below still has to happen.
    } finally {
      dispatch(logoutAction());
      dispatch(apiSlice.util.resetApiState());
      navigate("/");
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav id="main-nav" className={`header-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          <NavLink to="/courses" end onClick={close}>
            Browse
          </NavLink>

          {roleLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={close}>
              {label}
            </NavLink>
          ))}

          <ThemeToggle />

          {isAuthenticated ? (
            <button type="button" className="nav-link" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              <NavLink to="/auth/login" onClick={close}>
                Sign in
              </NavLink>
              <Link to="/auth/register" className="button button-primary button-small" onClick={close}>
                Join now <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </>
          )}
        </nav>
        <button
          type="button"
          className="menu-button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="main-nav"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
};

export default Header;

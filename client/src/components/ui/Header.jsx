import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLogoutMutation } from '@api/modules/authApi'; // adjust path if different
import { logout as logoutAction } from '@store/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap(); // ✅ call API to clear cookies
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch(logoutAction()); // ✅ clear Redux state
      navigate('/'); // ✅ redirect to home
    }
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          MyApp
        </Link>

        <div className="flex gap-4">
          <Link to="/profile/welcome" className="hover:underline ml-[5px]">
            Dashboard
          </Link>
          <Link to="/profile/edit" className="hover:underline ml-[5px]">
            Edit Profile
          </Link>
          <Link to="/profile/portfolio" className="hover:underline ml-[5px]">
            Portfolio
          </Link>
          <button
            onClick={handleLogout}
            className="hover:underline ml-[5px] text-red-600"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;

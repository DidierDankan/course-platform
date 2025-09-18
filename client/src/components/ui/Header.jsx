import { Link, useLocation } from 'react-router-dom';

const Header = () => {
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
          <Link to="/logout" className="hover:underline ml-[5px]">
            Logout
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;

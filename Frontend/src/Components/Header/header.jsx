import { Link } from "react-router-dom";
import { useAuth } from "../../Context/authContext";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md text-slate-800 px-6 py-4 flex justify-between items-center shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold tracking-tight text-indigo-600">
        SmartSched
      </Link>
      <nav className="flex gap-4 items-center font-medium">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>

        {!user ? (
          <>
            <Link to="/login" className="hover:text-indigo-600 transition-colors text-lg">
              Login
            </Link>
            <Link to="/register" className="hover:text-indigo-600 transition-colors text-lg">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="hover:text-indigo-600 transition-colors text-lg">
              Profile
            </Link>
            {user.name && (
              <span className="text-lg hidden md:block text-slate-600">
                Hi, {user.name.split(" ")[0]}
              </span>
            )}
            <button
              onClick={logout}
              className="ml-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-xl hover:bg-red-200 transition duration-200 text-lg font-medium shadow-sm"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;

import { Bell, Menu, Moon, Sun, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ darkMode, setDarkMode, toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-amber-100/20 dark:border-amber-900/20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-800 transition-all"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
            </div>
            <input
              className="w-full md:w-96 pl-11 pr-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              type="text"
              placeholder="Search orders, products, customers..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-800 transition-all group"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-amber-500 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 group-hover:text-amber-600 transition-colors" />
            )}
          </button>

          <button className="relative p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-800 transition-all group">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-amber-600 transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
          </button>

          <div className="ml-2 flex items-center gap-3 pl-3 border-l border-gray-200/50 dark:border-gray-700/50 relative group">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {user?.email?.split('@')[0] || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@ozme.com'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1" role="none">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Your Profile
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </a>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
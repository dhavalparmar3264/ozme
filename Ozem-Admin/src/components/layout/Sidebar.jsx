import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  Tag,
  MessageSquare,
  Settings,
  ChevronRight,
  Sparkles,
  LogOut,
  FolderTree,
  MessageCircle
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Handle closing sidebar on mobile
  const handleClose = () => {
    if (setIsOpen) {
      setIsOpen(false);
    } else if (toggleSidebar) {
      toggleSidebar();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'categories', label: 'Categories', icon: FolderTree, path: '/categories' },
    { id: 'products', label: 'Products', icon: Package, path: '/products' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/orders' },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, path: '/inventory' },
    { id: 'users', label: 'Users', icon: Users, path: '/users' },
    { id: 'coupons', label: 'Coupons', icon: Tag, path: '/coupons' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, path: '/reviews' },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle, path: '/feedback' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static bg-white dark:bg-gray-900 border-r border-amber-100/20 dark:border-amber-900/20`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-amber-100/20 dark:border-amber-900/20 px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Ozme Admin
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={handleClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-800/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-600'
                          } transition-colors`}
                        />
                        <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info & Logout */}
         <div className="p-4 border-t border-amber-100/20 dark:border-amber-900/20">
      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
          {/* Bottom Card */}
          {/* <div className="p-4 border-t border-amber-100/20 dark:border-amber-900/20">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 border border-amber-200/50 dark:border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Premium Features
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Unlock advanced analytics</p>
                </div>
              </div>
              <button className="w-full py-2 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all">
                Upgrade Now
              </button>
            </div>
          </div> */}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
};

export default Sidebar;
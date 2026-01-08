import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, LogOut, LogIn, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '.././assets/image/logo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';


const ScrollingBanner = () => {
  const messages = [
    "✨ Free Delivery on All Orders",
    "🎉 First-Time Shopper? Apply Code FIRST15 & Save 15% Instantly",
    "🌸 Crafted with Premium Ingredients for a Signature Scent",
    "🚀 Lightning-Fast Delivery with End-to-End Order Tracking"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const showNextMessage = () => {
      setIsScrolling(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);

        setTimeout(() => {
          setIsScrolling(false);
        }, 50);
      }, 600);
    };

    const timer = setTimeout(showNextMessage, 4000);
    return () => clearTimeout(timer);
  }, [currentIndex, messages.length]);

  return (
    <div className="relative bg-black text-white overflow-hidden h-10 min-h-[40px]">
      <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-70"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>

      <div className="relative h-10 min-h-[40px] flex items-center justify-center overflow-hidden px-2">
        <div
          className={`absolute w-full text-center transition-all duration-600 ease-in-out ${isScrolling
            ? 'opacity-0 -translate-y-8 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
            }`}
        >
          <p className="text-[10px] sm:text-xs md:text-sm font-light tracking-wide sm:tracking-[0.15em] text-white px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            {messages[currentIndex]}
          </p>
        </div>

        <div
          className={`absolute w-full text-center transition-all duration-600 ease-in-out ${isScrolling
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
            }`}
        >
          <p className="text-[10px] sm:text-xs md:text-sm font-light tracking-wide sm:tracking-[0.15em] text-white px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            {messages[(currentIndex + 1) % messages.length]}
          </p>
        </div>
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
    </div>
  );
};

export default function Headers() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const wishlistCount = getWishlistCount();
  
  // Debug: Log user data in header (development only)
  useEffect(() => {
    if (import.meta.env.DEV && isAuthenticated && user) {
      console.log('Header - User data:', { 
        hasUser: !!user, 
        hasPhotoURL: !!user?.photoURL, 
        photoURL: user?.photoURL,
        name: user?.name 
      });
    }
  }, [user, isAuthenticated]);
  
  // Check if we're on the wishlist page
  const isWishlistPage = location.pathname === '/wishlist';
  // Check if we're on the home page (to keep navbar transparent)
  const isHomePage = location.pathname === '/';
  // Check if we're on the feedback page (force white navbar)
  const isFeedbackPage = location.pathname === '/feedback';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and profile dropdown when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    // {
    //   name: 'Collections',
    //   dropdown: ['Oriental', 'Floral', 'Woody', 'Fresh', 'Limited Edition']
    // },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    ...(isAuthenticated ? [{ name: 'Your Orders', path: '/track-order' }] : [])
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleSearchButtonClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <>
      {/* Top Scrolling Banner - Always Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ScrollingBanner className="h-8" />

      </div>

      {/* Main Navbar - Becomes Fixed on Scroll */}
      <header className={`fixed top-10 left-0 right-0 z-[1000] transition-all duration-500 ${
        (isScrolled || !isHomePage || isFeedbackPage) ? 'bg-white shadow-lg' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="h-16 min-h-[64px] flex items-center justify-between gap-2">

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-all ${isScrolled || !isHomePage || isFeedbackPage
                ? 'hover:bg-gray-100 text-gray-800'
                : 'hover:bg-white/10 text-white'
                }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="relative transition-all duration-300 group-hover:scale-105">
                <img
                  src={logo}
                  alt="OZME PERFUMES"
                  className="h-20 sm:h-28 md:h-36 w-auto object-contain max-h-16 sm:max-h-20 md:max-h-24"
                />
              </div>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  className="relative group"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.path ? (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-1 font-medium transition-all text-sm tracking-wide whitespace-nowrap ${isScrolled || !isHomePage || isFeedbackPage
                        ? 'text-gray-800 hover:text-black'
                        : 'text-white hover:text-amber-300'
                        }`}
                    >
                      {item.name}
                      {item.dropdown && <ChevronDown className="w-4 h-4" />}
                    </Link>
                  ) : (
                    <button className={`flex items-center gap-1 font-medium transition-all text-sm tracking-wide whitespace-nowrap ${isScrolled || !isHomePage || isFeedbackPage
                      ? 'text-gray-800 hover:text-black'
                      : 'text-white hover:text-amber-300'
                      }`}>
                      {item.name}
                      {item.dropdown && <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Dropdown */}
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fadeIn">
                      {item.dropdown.map((subItem, subIdx) => (
                        <a
                          key={subIdx}
                          href="#"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Search */}
              <form 
                onSubmit={handleSearch}
                className={`hidden md:flex items-center ${isSearchOpen ? 'w-64' : 'w-auto'}`}
              >
                {isSearchOpen ? (
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search products..."
                      className="outline-none text-sm text-gray-900 w-full bg-transparent"
                    />
                    <button
                      type="submit"
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Search"
                    >
                      <Search className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Close search"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSearchButtonClick}
                    className={`p-2.5 rounded-lg transition-all group ${isScrolled || !isHomePage || isFeedbackPage
                      ? 'hover:bg-gray-100'
                      : 'hover:bg-white/10'
                      }`}
                    aria-label="Search"
                  >
                    <Search className={`w-5 h-5 transition-colors ${isScrolled || !isHomePage || isFeedbackPage
                      ? 'text-gray-600 group-hover:text-black'
                      : 'text-white group-hover:text-amber-300'
                      }`} />
                  </button>
                )}
              </form>

              {/* Wishlist */}
              <Link to="/wishlist" className="flex" onClick={() => setIsMobileMenuOpen(false)}>
                <button
                  className={`relative p-2.5 rounded-lg transition-all group ${isScrolled || !isHomePage || isFeedbackPage
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-white/10'
                    }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isScrolled || !isHomePage || isFeedbackPage
                    ? 'text-gray-600 group-hover:text-red-500'
                    : 'text-white group-hover:text-red-400'
                    }`} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="flex" onClick={() => setIsMobileMenuOpen(false)}>
                <button
                  className={`relative p-2.5 rounded-lg transition-all group ${isScrolled || !isHomePage || isFeedbackPage
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-white/10'
                    }`}
                  aria-label="Shopping cart"
                >
                  <ShoppingBag className={`w-5 h-5 transition-colors ${isScrolled || !isHomePage || isFeedbackPage
                    ? 'text-gray-600 group-hover:text-black'
                    : 'text-white group-hover:text-amber-300'
                    }`} />
                  {getCartItemCount() > 0 && (
                    <span className={`absolute top-1 right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-bold ${isScrolled || !isHomePage || isFeedbackPage ? 'bg-black' : 'bg-amber-500'
                      }`}>
                      {getCartItemCount() > 9 ? '9+' : getCartItemCount()}
                    </span>
                  )}
                </button>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => {
                    // If not authenticated, redirect to login immediately
                    if (!isAuthenticated) {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                      return;
                    }
                    // If authenticated, toggle dropdown
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-lg transition-all group flex items-center justify-center min-w-[40px] min-h-[40px] ${isScrolled || !isHomePage || isFeedbackPage ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                    }`}
                  aria-label="Profile"
                >
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    {isAuthenticated && user?.photoURL ? (
                      <>
                        <img
                          src={user.photoURL}
                          alt={user.name || 'User'}
                          className="w-6 h-6 rounded-full object-cover border-2 shadow-sm"
                          style={{
                            borderColor: isScrolled || !isHomePage || isFeedbackPage ? '#e5e7eb' : 'rgba(255, 255, 255, 0.8)'
                          }}
                          onError={(e) => {
                            // Hide image and show User icon if image fails to load
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector('.user-icon-fallback');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                              fallback.style.display = 'block';
                            }
                          }}
                        />
                        <User
                          className={`hidden user-icon-fallback w-5 h-5 transition-colors flex-shrink-0 absolute inset-0 m-auto ${isScrolled || !isHomePage || isFeedbackPage
                            ? 'text-gray-600 group-hover:text-black'
                            : 'text-white group-hover:text-amber-300'
                            }`}
                          strokeWidth={2}
                        />
                      </>
                    ) : (
                      <User
                        className={`w-5 h-5 transition-colors flex-shrink-0 ${isScrolled || !isHomePage || isFeedbackPage
                          ? 'text-gray-600 group-hover:text-black'
                          : 'text-white group-hover:text-amber-300'
                          }`}
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu - Only show if authenticated */}
                {isAuthenticated && isProfileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fadeIn z-50 ${isScrolled || !isHomePage ? '' : ''}`}>
                    <Link
                      to="/dashboard"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/track-order"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </Link>
                    <button
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`lg:hidden pb-6 pt-4 border-t animate-fadeIn ${isScrolled || !isHomePage
              ? 'border-gray-200 bg-white' 
              : 'border-white/20 bg-black/95 backdrop-blur-sm'
              }`}>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item, idx) => (
                  <div key={idx}>
                    {item.path ? (
                      <Link
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg font-medium transition-colors ${isScrolled || !isHomePage
                          ? 'text-gray-800 hover:bg-gray-50'
                          : 'text-white hover:bg-white/10'
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className={`block px-4 py-3 rounded-lg font-medium transition-colors ${isScrolled || !isHomePage
                          ? 'text-gray-800 hover:bg-gray-50'
                          : 'text-white hover:bg-white/10'
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    )}
                    {item.dropdown && (
                      <div className="pl-8 space-y-1 mt-1">
                        {item.dropdown.map((subItem, subIdx) => (
                          <a
                            key={subIdx}
                            href="#"
                            className={`block px-4 py-2 text-sm transition-colors ${isScrolled
                              ? 'text-gray-600 hover:text-black'
                              : 'text-white/80 hover:text-white'
                              }`}
                          >
                            {subItem}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isAuthenticated && (
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${isScrolled || !isHomePage
                      ? 'text-gray-800 hover:bg-gray-50'
                      : 'text-white hover:bg-white/10'
                      }`}
                  >
                    Logout
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
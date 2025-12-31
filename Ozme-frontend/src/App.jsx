// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './componets/ProtectedRoute';
import ScrollToTop from './componets/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import Headers from './componets/Headers';
import Footer from './componets/Footer';
import Home from './pages/Home';
import ShopPage from './pages/Shop';
import ProductDetailsPage from './componets/Product';
import ProductModal from './componets/ProductModel';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Reviews from './pages/Reviews';
import Refund from './pages/Refund';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Shipping from './pages/Shipping';
import FAQ from './pages/FAQ';
import TrackOrder from './pages/TrackOrder';
import CheckoutSuccess from './pages/CheckoutSuccess';
import SearchResults from './pages/SearchResults';
import { useState } from 'react';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current page should hide header/footer
  const isAuthPage = location.pathname === '/login';
  const isProductPage = location.pathname.startsWith('/product/');

  // Navigate to Product Details Page (when clicking product card)
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  // Open Quick View Modal (when clicking eye icon)
  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  // Close Quick View Modal
  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  // Navigate back to Shop Page
  const handleBackToShop = () => {
    navigate('/shop');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Scroll to top on route change */}
      <ScrollToTop />
      
      {/* Show header only if not on login or product page */}
      {!isProductPage && !isAuthPage && <Headers />}

      <main className="flex-grow w-full overflow-x-hidden">
        <Toaster position="top-center" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/shop"
            element={
              <ShopPage
                onProductClick={handleProductClick}
                onQuickView={handleQuickView}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchResults
                onProductClick={handleProductClick}
                onQuickView={handleQuickView}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductDetailsPage
                onBack={() => navigate('/shop')}
              />
            }
          />

          {/* Policy pages */}
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/shipping" element={<Shipping />} />

          {/* Auth pages */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />

          {/* Protected routes */}
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/checkout/success" element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          } />
          <Route path="/track-order" element={
            <ProtectedRoute>
              <TrackOrder />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Show footer only if not on login or product page */}
      {!isProductPage && !isAuthPage && <Footer />}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductModal
          product={quickViewProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  );
}

export default App;
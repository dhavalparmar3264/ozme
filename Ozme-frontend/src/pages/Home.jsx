import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  Sparkles,
  Shield,
  Truck,
  Gift,
  Heart,
  ShoppingCart,
  Eye,
  Loader2
} from 'lucide-react';
import homeBg from '../assets/image/home1.png';
import Testimonials from '../componets/Home/Testimonials';
import Hero from '../componets/Home/Hero';
import ProductModal from '../componets/Home/ProductDetails';
import { filterProducts } from '../utils/filterProducts';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiRequest } from '../utils/api';
import toast from 'react-hot-toast';


export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('query') || '';
  const [email, setEmail] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [hoveredCollection, setHoveredCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([
    {
      name: 'Oriental',
      image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=1000&fit=crop',
      count: '0',
      description: 'Rich & Exotic'
    },
    {
      name: 'Floral',
      image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&h=1000&fit=crop',
      count: '0',
      description: 'Fresh & Romantic'
    },
    {
      name: 'Woody',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=1000&fit=crop',
      count: '0',
      description: 'Warm & Earthy'
    }
  ]);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Fetch bestseller/featured products
  useEffect(() => {
    fetchFeaturedProducts();
    fetchCollections();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch bestseller products (tag='Bestseller') or top rated products
      // Limit to 3 products for Best Selling section
      const response = await apiRequest('/products?tag=Bestseller&limit=3');
      
      if (response && response.success) {
        // Transform backend products to frontend format
        const transformedProducts = response.data.products
          .filter(product => product.active && product.inStock)
          .slice(0, 3) // Limit to exactly 3 products
          .map(product => ({
            id: product._id,
            _id: product._id,
            name: product.name,
            category: product.gender === 'Men' ? 'For Him' : product.gender === 'Women' ? 'For Her' : 'Unisex',
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400x600?text=No+Image',
            images: product.images || [],
            rating: product.rating || 0,
            reviews: product.reviewsCount || 0,
            tag: product.tag || null,
            description: product.description || product.shortDescription || '',
            gender: product.gender?.toLowerCase() || 'unisex',
            inStock: product.inStock,
            stockQuantity: product.stockQuantity || 0,
            size: product.size || '120ML'
          }));

        // If no bestsellers, fetch top rated products instead
        if (transformedProducts.length === 0) {
          const topRatedResponse = await apiRequest('/products?limit=3');
          if (topRatedResponse && topRatedResponse.success) {
            const topRated = topRatedResponse.data.products
              .filter(product => product.active && product.inStock)
              .slice(0, 3) // Limit to exactly 3 products
              .map(product => ({
                id: product._id,
                _id: product._id,
                name: product.name,
                category: product.gender === 'Men' ? 'For Him' : product.gender === 'Women' ? 'For Her' : 'Unisex',
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400x600?text=No+Image',
                images: product.images || [],
                rating: product.rating || 0,
                reviews: product.reviewsCount || 0,
                tag: product.tag || null,
                description: product.description || product.shortDescription || '',
                gender: product.gender?.toLowerCase() || 'unisex',
                inStock: product.inStock,
                stockQuantity: product.stockQuantity || 0,
                size: product.size || '120ML'
              }))
              .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Sort by rating
            
            setProducts(topRated);
          }
        } else {
          setProducts(transformedProducts);
        }
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
      toast.error('Failed to load featured products');
      // Keep empty array on error - page will still render
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      // Fetch products grouped by category to create collections
      const response = await apiRequest('/products?limit=100');
      
      if (response && response.success) {
        const productsData = response.data.products || [];
        
        // Group by category and create collections
        const categoryMap = {};
        productsData.forEach(product => {
          if (product.category && product.active && product.inStock) {
            if (!categoryMap[product.category]) {
              categoryMap[product.category] = {
                name: product.category,
                count: 0,
                image: product.images?.[0] || 'https://via.placeholder.com/800x1000?text=Collection'
              };
            }
            categoryMap[product.category].count++;
            // Use first product image as collection image if not set
            if (!categoryMap[product.category].image && product.images?.[0]) {
              categoryMap[product.category].image = product.images[0];
            }
          }
        });

        // Convert to array and add descriptions
        const collectionsArray = Object.values(categoryMap)
          .slice(0, 3) // Limit to 3 collections
          .map((col, idx) => ({
            ...col,
            description: idx === 0 ? 'Rich & Exotic' : idx === 1 ? 'Fresh & Romantic' : 'Warm & Earthy',
            count: col.count.toString()
          }));

        setCollections(collectionsArray.length > 0 ? collectionsArray : [
          {
            name: 'Oriental',
            image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=1000&fit=crop',
            count: '48',
            description: 'Rich & Exotic'
          },
          {
            name: 'Floral',
            image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&h=1000&fit=crop',
            count: '56',
            description: 'Fresh & Romantic'
          },
          {
            name: 'Woody',
            image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=1000&fit=crop',
            count: '34',
            description: 'Warm & Earthy'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      // Use default collections on error
      setCollections([
        {
          name: 'Oriental',
          image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=1000&fit=crop',
          count: '48',
          description: 'Rich & Exotic'
        },
        {
          name: 'Floral',
          image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&h=1000&fit=crop',
          count: '56',
          description: 'Fresh & Romantic'
        },
        {
          name: 'Woody',
          image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=1000&fit=crop',
          count: '34',
          description: 'Warm & Earthy'
        }
      ]);
    }
  };

  const features = [
    {
      icon: Shield,
      title: '100% Authentic',
      description: 'Guaranteed genuine fragrances',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'On all orders',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Gift,
      title: 'Gift Packaging',
      description: 'Complimentary luxury wrapping',
      gradient: 'from-pink-500 to-pink-600'
    }
  ];

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const response = await apiRequest('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response && response.success) {
        toast.success(response.message || '🎉 Successfully subscribed! Welcome to OZME Perfumes family');
        setEmail('');
      } else {
        const errorMsg = response?.message || 'Failed to subscribe. Please try again.';
        console.error('Newsletter subscription failed:', {
          status: 'unknown',
          message: errorMsg,
          response
        });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data
      });
      const errorMsg = error.response?.data?.message || error.message || 'Failed to subscribe. Please try again.';
      toast.error(errorMsg);
    }
  };

  const handleAddToCart = (product, quantity) => {
    // Implement add to cart functionality
    alert(`Added ${quantity} x ${product.name} to cart`);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero />

      {/* Featured Products */}
      <div className="min-h-screen bg-white">
        {/* Featured Products Section */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20">
              {/* Tagline */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full border border-gray-100">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-gray-900 tracking-[0.2em] uppercase">Featured Collection</span>
                </div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
              </div>

              {/* Title */}
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight">
                Best Selling
                <span className="block font-serif italic text-gray-800 mt-2">Fragrances</span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                Discover our most loved perfumes, handpicked for those who appreciate the finer things in life
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-gray-400 text-lg">No featured products available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {filterProducts(products, searchQuery).map((product) => (
                <div
                  key={product.id}
                  className="group"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="relative">
                    {/* Product Image Container - No Rounded Corners */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-md group-hover:shadow-2xl transition-all duration-500">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Tag Badge */}
                      {product.tag && (
                        <div className={`absolute top-4 left-4 px-4 py-2 backdrop-blur-md text-xs font-bold tracking-wider ${product.tag === 'Bestseller' ? 'bg-black/80 text-white' :
                            product.tag === 'New' ? 'bg-blue-600/80 text-white' :
                              'bg-purple-600/80 text-white'
                          }`}>
                          {product.tag}
                        </div>
                      )}

                      {/* Floating Action Buttons */}
                      <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                          className={`w-11 h-11 bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-300 ${isInWishlist(product.id) ? 'bg-red-50' : ''}`}
                        >
                          <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-700 hover:text-red-500'}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className="w-11 h-11 bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-gray-100 hover:scale-110 transition-all duration-300"
                        >
                          <Eye className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>

                      {/* Quick Add to Cart Button */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product, 1, '120ml'); }}
                          className="w-full py-3 bg-white text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl "
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="mt-5 space-y-3">
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                          {product.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
                          <span className="text-xs text-gray-400">({product.reviews})</span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xl font-light text-gray-900 group-hover:text-amber-600 transition-colors duration-300">
                        {product.name}
                      </h3>

                      {/* Price Section - Elegant & Clean */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-gray-400 font-light tracking-wide">₹</span>
                          <span className="text-3xl font-light text-gray-900 tracking-tight">
                            {product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 line-through font-light">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Discount Badge - Separate Line */}
                      <div>
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium tracking-wide">
                          Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Mobile Add to Cart Button - Visible on mobile only */}
                    <div className="mt-4 md:hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product, 1, '120ml'); }}
                        className="w-full py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}

            {/* View All Button */}
            <div className="text-center mt-16">
              <button 
                type="button"
                onClick={() => navigate('/shop')}
                className="group px-12 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 mx-auto cursor-pointer"
              >
                View All Products
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </section>

        {/* Collections Section - White Background */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20">
              {/* Decorative Line */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
                <Sparkles className="w-5 h-5 text-gray-900" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
              </div>

              {/* Title */}
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight">
                Shop by
                <span className="block font-serif italic text-gray-800 mt-2">Collection</span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                Find your perfect fragrance family from our curated collections
              </p>
            </div>

            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {collections.map((collection, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-[4/5] overflow-hidden cursor-pointer"
                  onMouseEnter={() => setHoveredCollection(idx)}
                  onMouseLeave={() => setHoveredCollection(null)}
                >
                  {/* Image */}
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500"></div>

                  {/* Decorative Border */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-all duration-500"></div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    {/* Collection Number */}
                    <div className="text-8xl font-serif text-white/10 absolute top-8 right-8 transition-all duration-500 group-hover:text-white/20">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/70 mb-3 tracking-widest uppercase transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
                      {collection.description}
                    </p>

                    {/* Collection Name */}
                    <h3 className="text-4xl md:text-5xl font-serif font-light text-white mb-2 transform group-hover:-translate-y-2 transition-all duration-500">
                      {collection.name}
                    </h3>

                    {/* Decorative Line */}
                    <div className="h-px bg-gradient-to-r from-amber-400/80 to-transparent mb-4 w-0 group-hover:w-32 transition-all duration-700"></div>

                    {/* Count & Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-light">
                        {collection.count} Fragrances
                      </span>

                      
                    </div>
                  </div>

                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>

          
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="bg-black py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 justify-items-center">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center group w-full max-w-xs">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white/50 transition-all duration-300 mx-auto">
                      <feature.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                <h3 className="text-white text-sm font-semibold tracking-wider mb-3 uppercase">
                  {feature.title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <section
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `url(${homeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Blurred gradient elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Get Exclusive Offers
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Subscribe and get 10% off your first order
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 backdrop-blur-sm"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg whitespace-nowrap cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
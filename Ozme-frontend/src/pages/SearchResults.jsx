import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, Star, Heart, ShoppingCart, Eye, Sparkles, Search } from 'lucide-react';
import { products, categories } from '../data/productData';
import { filterProducts } from '../utils/filterProducts';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function SearchResults({ onProductClick, onQuickView }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 2000],
    rating: 0,
    gender: 'all',
    sortBy: 'popularity'
  });

  // Filter products based on search query
  const searchFilteredProducts = filterProducts(products, query);

  // Apply additional filters
  const filteredProducts = searchFilteredProducts.filter(product => {
    if (filters.category !== 'all' && product.gender !== filters.category) return false;
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
    if (product.rating < filters.rating) return false;
    if (filters.gender !== 'all' && product.gender !== filters.gender) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'newest': return b.id - a.id;
      default: return b.reviews - a.reviews;
    }
  });

  const handlePriceChange = (index, value) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(value);
    setFilters({ ...filters, priceRange: newRange });
  };

  const resetFilters = () => setFilters({
    category: 'all', priceRange: [0, 2000], rating: 0, gender: 'all', sortBy: 'popularity'
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative -top-4 h-auto min-h-[40vh] sm:min-h-[50vh] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: 'url(https://i.pinimg.com/736x/41/ca/f8/41caf8f7edea7f741ab4f7537667a8e7.jpg)'
        }}>
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-4 sm:px-6 md:px-8 z-10 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-0">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                <Search className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-white tracking-[0.2em] uppercase">Search Results</span>
              </div>
              <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6">
              <span className="block text-white font-light tracking-tight">
                {query ? `Results for "${query}"` : 'Search Products'}
              </span>
            </h1>
            {query && (
              <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
                Found {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 md:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 ${showFilters ? 'fixed inset-0 z-50 bg-white p-4 sm:p-6 overflow-y-auto' : 'hidden lg:block'}`}>
              <div className="sticky top-4 sm:top-6 md:top-24">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-light text-gray-900 flex items-center gap-2 tracking-tight">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5" />Filters
                  </h2>
                  {showFilters && (
                    <button onClick={() => setShowFilters(false)} className="lg:hidden p-2">
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}
                </div>
                <div className="space-y-6 sm:space-y-8">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 sm:mb-3 text-gray-900 uppercase tracking-widest">Category</label>
                    <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-all">
                      <option value="all">All Categories</option>
                      {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                    </select>
                  </div>
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 sm:mb-3 text-gray-900 uppercase tracking-widest">Gender</label>
                    <div className="space-y-2">
                      {['all', 'men', 'women', 'unisex'].map(gender => (
                        <label key={gender} className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
                          <input type="radio" name="gender" value={gender} checked={filters.gender === gender}
                            onChange={(e) => setFilters({ ...filters, gender: e.target.value })} className="w-4 h-4 text-gray-900" />
                          <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                            {gender === 'all' ? 'All Fragrances' : gender}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Price Range */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 sm:mb-3 text-gray-900 uppercase tracking-widest">Price Range</label>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <span>₹{filters.priceRange[0]}</span><span>₹{filters.priceRange[1]}</span>
                      </div>
                      <input type="range" min="0" max="2000" value={filters.priceRange[0]} onChange={(e) => handlePriceChange(0, e.target.value)} className="w-full" />
                      <input type="range" min="0" max="2000" value={filters.priceRange[1]} onChange={(e) => handlePriceChange(1, e.target.value)} className="w-full" />
                    </div>
                  </div>
                  {/* Rating Filter */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 sm:mb-3 text-gray-900 uppercase tracking-widest">Minimum Rating</label>
                    <select value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: parseFloat(e.target.value) })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-all">
                      <option value="0">All Ratings</option>
                      <option value="4">4★ & above</option>
                      <option value="4.5">4.5★ & above</option>
                      <option value="4.8">4.8★ & above</option>
                    </select>
                  </div>
                  <button onClick={resetFilters} className="w-full py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300">
                    Reset Filters
                  </button>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <main className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
                <button onClick={() => setShowFilters(true)} className="lg:hidden flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all w-full sm:w-auto">
                  <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />Filters
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:ml-auto w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-600 font-light text-center sm:text-left">{sortedProducts.length} Products</span>
                  <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 border-gray-200 focus:border-gray-900 focus:outline-none">
                    <option value="popularity">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="text-center py-12 sm:py-16 md:py-24 px-4">
                  <Search className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-2 font-light">
                    {query ? `No products found for "${query}"` : 'No products found matching your criteria'}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">Try adjusting your search or filters</p>
                  <button onClick={() => navigate('/shop')} className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all">
                    Browse All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                  {sortedProducts.map((product) => (
                    <div key={product.id} className="group" onMouseEnter={() => setHoveredProduct(product.id)} onMouseLeave={() => setHoveredProduct(null)}>
                      <div className="relative">
                        {/* Product Image - Click to go to Product Page */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-md group-hover:shadow-2xl transition-all duration-500 cursor-pointer"
                          onClick={() => onProductClick(product)}>
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          {/* Tags */}
                          {(product.bestseller || product.tag) && (
                            <div className={`absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-wider ${
                              product.bestseller ? 'bg-black/80 text-white' : product.tag === 'New' ? 'bg-blue-600/80 text-white' : 'bg-purple-600/80 text-white'
                            }`}>
                              {product.bestseller ? 'BESTSELLER' : product.tag?.toUpperCase()}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 flex flex-col gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-300 ${isInWishlist(product.id) ? 'bg-red-50' : ''}`}>
                              <Heart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-700 hover:text-red-500'}`} />
                            </button>
                            {/* Eye Icon - Opens Quick View Modal */}
                            <button onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-gray-100 hover:scale-110 transition-all duration-300">
                              <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-gray-700" />
                            </button>
                          </div>

                          {/* Add to Cart */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                            <button onClick={(e) => { e.stopPropagation(); addToCart(product, 1, '120ml'); }}
                              className="w-full py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm bg-white text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl">
                                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />Add to Cart
                            </button>
                          </div>
                        </div>

                        {/* Product Info - Click to go to Product Page */}
                        <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3 cursor-pointer" onClick={() => onProductClick(product)}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">{product.category}</span>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{product.rating}</span>
                              <span className="text-[10px] sm:text-xs text-gray-400">({product.reviews})</span>
                            </div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-light text-gray-900 group-hover:text-amber-600 transition-colors duration-300 leading-tight">{product.name}</h3>
                          <div className="flex items-center gap-2 sm:gap-3 pt-1">
                            <div className="flex items-baseline gap-1 sm:gap-2">
                              <span className="text-xs sm:text-sm text-gray-400 font-light tracking-wide">₹</span>
                              <span className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">{product.price.toLocaleString('en-IN')}</span>
                            </div>
                            {product.originalPrice && (
                              <span className="text-xs sm:text-sm text-gray-400 line-through font-light">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                          {product.discount && (
                            <div><span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium tracking-wide">Save {product.discount}%</span></div>
                          )}
                        </div>

                        {/* Mobile Add to Cart Button - Visible on mobile only */}
                        <div className="mt-3 sm:mt-4 md:hidden">
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product, 1, '120ml'); }}
                            className="w-full py-2.5 sm:py-3 text-sm bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
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
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SearchResults;


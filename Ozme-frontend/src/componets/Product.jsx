

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Share2, Plus, Minus, Truck, Shield, ChevronLeft, ChevronRight, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Headers from './Headers';
import toast from 'react-hot-toast';

function Product({ onBack }) {
  const { addToCart, addingToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({ total: 0, avgRating: '0.0', ratingDistribution: {} });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Fetch reviews when product ID changes
  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Fetch approved reviews for this product
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await apiRequest(`/reviews/product/${id}`);
      
      if (response && response.success) {
        setReviews(response.data?.reviews || []);
        setReviewStats(response.data?.stats || { total: 0, avgRating: '0.0', ratingDistribution: {} });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      // Don't show error toast for reviews, just fail silently
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(`/products/${id}`);

      if (response && response.success && response.data.product) {
        const backendProduct = response.data.product;
        
        // Transform backend product to frontend format
        // Transform sizes: use sizes array if available, otherwise create from single size
        let sizes = [];
        if (backendProduct.sizes && Array.isArray(backendProduct.sizes) && backendProduct.sizes.length > 0) {
          // Use sizes array from backend
          sizes = backendProduct.sizes.map(s => ({
            value: s.size,
            label: s.size,
            price: s.price,
            originalPrice: s.originalPrice || s.price,
            stockQuantity: s.stockQuantity || 0,
            inStock: s.inStock !== undefined ? s.inStock : (s.stockQuantity > 0),
          }));
        } else {
          // Backward compatibility: create single size from old fields
          sizes = [{
            value: backendProduct.size || '120ML',
            label: backendProduct.size || '120ML',
            price: backendProduct.price,
            originalPrice: backendProduct.originalPrice || backendProduct.price,
            stockQuantity: backendProduct.stockQuantity || 0,
            inStock: backendProduct.inStock !== undefined ? backendProduct.inStock : (backendProduct.stockQuantity > 0),
          }];
        }

        const transformedProduct = {
          id: backendProduct._id,
          _id: backendProduct._id,
          name: backendProduct.name,
          description: backendProduct.description || backendProduct.shortDescription || '',
          shortDescription: backendProduct.shortDescription || '',
          category: backendProduct.category || 'Perfume',
          gender: backendProduct.gender || 'Unisex',
          price: sizes.length > 0 ? sizes[0].price : backendProduct.price, // Use first size price for display
          originalPrice: sizes.length > 0 ? sizes[0].originalPrice : (backendProduct.originalPrice || backendProduct.price),
          discount: sizes.length > 0 && sizes[0].originalPrice
            ? Math.round(((sizes[0].originalPrice - sizes[0].price) / sizes[0].originalPrice) * 100)
            : (backendProduct.originalPrice 
                ? Math.round(((backendProduct.originalPrice - backendProduct.price) / backendProduct.originalPrice) * 100)
                : 0),
          images: backendProduct.images && backendProduct.images.length > 0 
            ? backendProduct.images 
            : ['https://via.placeholder.com/400x600?text=No+Image'],
          image: backendProduct.images?.[0] || 'https://via.placeholder.com/400x600?text=No+Image',
          rating: backendProduct.rating || 0,
          reviews: backendProduct.reviewsCount || 0,
          tag: backendProduct.tag || null,
          bestseller: backendProduct.tag === 'Bestseller',
          size: sizes.length > 0 ? sizes[0].value : (backendProduct.size || '120ML'),
          sizes: sizes, // Add sizes array
          stockQuantity: sizes.reduce((sum, s) => sum + s.stockQuantity, 0), // Total stock across all sizes
          inStock: sizes.some(s => s.inStock), // Product is in stock if any size is in stock
          active: backendProduct.active !== undefined ? backendProduct.active : true,
          // Optional fields that might not exist
          highlights: backendProduct.highlights || [],
          notes: backendProduct.notes || {
            top: 'Not specified',
            heart: 'Not specified',
            base: 'Not specified',
          },
          customerReviews: backendProduct.customerReviews || [],
        };

        setProduct(transformedProduct);
        
        // Set default selected size (first available size or first size in stock)
        if (sizes.length > 0) {
          const firstInStock = sizes.find(s => s.inStock);
          const defaultSize = firstInStock ? firstInStock.value : sizes[0].value;
          setSelectedSize(defaultSize);
          // Reset quantity to 1 when product changes
          setQuantity(1);
        } else if (backendProduct.size) {
          setSelectedSize(backendProduct.size);
          setQuantity(1);
        }
      } else {
        throw new Error(response?.message || 'Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product details');
      toast.error(err.message || 'Product not found');
      // Redirect to shop after a delay
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Headers />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Headers />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error || 'Product not found'}</p>
            <button 
              onClick={() => navigate('/shop')}
              className="px-6 py-2.5 bg-black text-white font-semibold hover:bg-gray-900 transition-all"
            >
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use sizes from product (already transformed from backend)
  const sizes = product.sizes || [];
  
  // Ensure selectedSize is set (default to first available size)
  const effectiveSelectedSize = selectedSize || (sizes.length > 0 ? sizes[0].value : '120ML');
  if (!selectedSize && sizes.length > 0) {
    setSelectedSize(effectiveSelectedSize);
  }
  
  const selectedSizeObj = sizes.find(s => s.value === effectiveSelectedSize || s.size === effectiveSelectedSize);
  const currentPrice = selectedSizeObj?.price || product.price;
  const selectedSizeStock = selectedSizeObj?.stockQuantity || 0;
  const selectedSizeInStock = selectedSizeObj?.inStock !== undefined ? selectedSizeObj.inStock : (selectedSizeStock > 0);

  const nextImage = () => setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  const prevImage = () => setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));

  const handleAddToCartClick = async () => {
    // Use the actual backend size internally, but display "120 ML" to user
    const sizeToUse = selectedSize || effectiveSelectedSize;
    
    if (!sizeToUse) {
      toast.error('Please select a size');
      return;
    }
    
    if (!selectedSizeInStock || selectedSizeStock === 0) {
      toast.error(`Size 120 ML is out of stock`);
      return;
    }
    
    if (quantity > selectedSizeStock) {
      toast.error(`Only ${selectedSizeStock} items available in stock for 120 ML`);
      return;
    }
    
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    
    // Pass the actual backend size to addToCart (for cart logic), but user sees "120 ML"
    await addToCart(product, quantity, sizeToUse, currentPrice);
  };

  const handleWhatsAppOrder = () => {
    // Display "120 ML" to user, but use actual backend size internally if needed
    const message = `Hi, I want to order:\n\n*${product.name}*\nSize: 120 ML\nQuantity: ${quantity}\nPrice: ₹${(currentPrice * quantity).toLocaleString('en-IN')}\n\nPlease confirm availability.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBuyNow = () => {
    // Validate size and stock
    if (!selectedSizeInStock || selectedSizeStock === 0) {
      toast.error(`Size 120 ML is out of stock`);
      return;
    }
    
    if (quantity > selectedSizeStock) {
      toast.error(`Only ${selectedSizeStock} items available in stock for 120 ML`);
      return;
    }

    // Determine the price to use
    const itemPrice = currentPrice;
    let itemOriginalPrice = product.originalPrice || product.price;
    if (product.sizes && Array.isArray(product.sizes) && selectedSize) {
      const sizeObj = product.sizes.find(s => s.value === selectedSize || s.size === selectedSize);
      if (sizeObj && sizeObj.originalPrice) {
        itemOriginalPrice = sizeObj.originalPrice;
      }
    }

    // Prepare the buyNowItem payload
    const buyNowItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      category: product.category || product.gender || 'Unisex',
      price: itemPrice,
      originalPrice: itemOriginalPrice,
      image: product.images?.[0] || product.image || '',
      quantity: quantity,
      size: selectedSize || '120ML',
      stock: selectedSizeStock
    };

    // Save to sessionStorage (clears on tab close, but persists during navigation)
    try {
      sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      // Also save to localStorage as backup
      localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      
      // Redirect to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error saving buyNowItem:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Headers />
      
      {/* Product Details - Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* ⬅️ Back to Shop Button (Added as requested) */}
        <div className="mt-20 mb-5">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Side - Image Gallery */}
          <div className="relative">
            {/* Tags: BESTSELLER, NEW, LIMITED and Discount */}
            <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
              {product.tag && (
                <div className={`px-3 py-1 text-white text-xs font-bold tracking-wider ${
                  product.tag === 'Bestseller' ? 'bg-black' :
                  product.tag === 'New' ? 'bg-blue-600' :
                  'bg-purple-600'
                }`}>
                  {product.tag.toUpperCase()}
                </div>
              )}
              {product.discount > 0 && (
                <div className="px-3 py-1 bg-green-600 text-white text-xs font-bold tracking-wider">
                  {product.discount}% OFF
                </div>
              )}
            </div>

            {/* Main Image Container */}
            <div className="flex items-center justify-center relative group bg-gray-50 p-4 sm:p-8">
              <div className="relative w-full max-w-lg h-[300px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex items-center justify-center overflow-hidden">
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name} 
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center shadow-xl transition-transform duration-500 group-hover:scale-[1.02]" 
                />
                {/* Navigation Buttons */}
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-black hover:text-white flex items-center justify-center rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-black hover:text-white flex items-center justify-center rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 justify-center mt-4">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 border-2 transition-all duration-300 flex items-center justify-center overflow-hidden bg-white ${selectedImage === idx ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}>
                  <img src={img} alt={`View ${idx + 1}`} className="max-w-full max-h-full w-auto h-auto object-contain object-center" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="flex flex-col pt-8 lg:pt-0">
            
            <h1 className="text-4xl lg:text-4xl font-normal text-gray-900 mb-2">{product.name}</h1>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {/* Star Rating Display - Use live review stats if available */}
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${
                    i < Math.floor(parseFloat(reviewStats.avgRating) || product.rating) 
                      ? 'text-amber-500 fill-amber-500' 
                      : 'text-gray-300'
                  }`} />
                ))}
              </div>
              <span className="text-base font-medium text-gray-900">
                {reviewStats.total > 0 ? reviewStats.avgRating : product.rating}
              </span>
              <span className="text-gray-400 text-sm">|</span>
              <span 
                className="text-gray-600 text-sm cursor-pointer hover:text-amber-600 transition-colors"
                onClick={() => setActiveTab('reviews')}
              >
                {reviewStats.total > 0 ? reviewStats.total : product.reviews} Reviews
              </span>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-normal text-gray-900">₹{currentPrice.toLocaleString('en-IN')}</span>
                {selectedSizeObj && selectedSizeObj.originalPrice && selectedSizeObj.originalPrice > selectedSizeObj.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">₹{selectedSizeObj.originalPrice.toLocaleString('en-IN')}</span>
                    {Math.round(((selectedSizeObj.originalPrice - selectedSizeObj.price) / selectedSizeObj.originalPrice) * 100) > 0 && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-sm font-semibold">
                        Save {Math.round(((selectedSizeObj.originalPrice - selectedSizeObj.price) / selectedSizeObj.originalPrice) * 100)}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8 text-sm">
              {product.description || product.shortDescription || 'Product description coming soon.'}
            </p>

            {/* Size Selection - Static Display */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase">SIZE</label>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {/* Static 120 ML display - non-clickable */}
                <div className="py-2.5 sm:py-3 px-4 sm:px-6 text-center border-2 border-black bg-black text-white cursor-default">
                  <div className="font-semibold text-xs sm:text-sm">120 ML</div>
                  <div className="text-[10px] sm:text-xs mt-1 opacity-80">
                    ₹{currentPrice.toLocaleString('en-IN')}
                    {selectedSizeObj?.originalPrice && selectedSizeObj.originalPrice > currentPrice && (
                      <span className="block text-gray-400 line-through text-[9px] sm:text-[10px]">
                        ₹{selectedSizeObj.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase">
                QUANTITY {selectedSizeStock > 0 && (
                  <span className="text-xs font-normal text-gray-500 normal-case">({selectedSizeStock} available for 120 ML)</span>
                )}
              </label>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center border border-gray-300 rounded">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1 || addingToCart}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-medium text-black border-x border-gray-300">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => {
                      const maxQty = selectedSizeStock > 0 ? Math.min(selectedSizeStock, 10) : 10;
                      return Math.min(q + 1, maxQty);
                    })} 
                    className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= (selectedSizeStock > 0 ? Math.min(selectedSizeStock, 10) : 10) || addingToCart}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {quantity > 1 && <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Total: ₹{(currentPrice * quantity).toLocaleString('en-IN')}</span>}
              </div>
            </div>

            {/* Stock Status */}
            {!selectedSizeInStock || selectedSizeStock === 0 ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 font-semibold text-sm">Size 120 ML is Out of Stock</p>
              </div>
            ) : selectedSizeStock < 10 ? (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded">
                <p className="text-amber-700 font-semibold text-sm">Only {selectedSizeStock} left in stock for 120 ML!</p>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button 
                  onClick={handleAddToCartClick} 
                  disabled={!selectedSizeInStock || selectedSizeStock === 0 || addingToCart || !selectedSize}
                  className={`flex-1 min-w-0 py-3 px-2 sm:px-3 font-semibold text-xs sm:text-sm tracking-wide sm:tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full ${
                    !selectedSizeInStock || selectedSizeStock === 0 || addingToCart || !selectedSize
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      : 'bg-yellow-400 text-black hover:bg-yellow-500'
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                      <span className="whitespace-nowrap">Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{!selectedSizeInStock || selectedSizeStock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={!selectedSizeInStock || selectedSizeStock === 0}
                  className={`flex-1 min-w-0 py-3 px-2 sm:px-3 font-semibold text-xs sm:text-sm tracking-wide sm:tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full ${
                    !selectedSizeInStock || selectedSizeStock === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      : 'bg-orange-400 text-black hover:bg-orange-500'
                  }`}
                >
                  <span className="whitespace-nowrap">BUY NOW</span>
                </button>
                <button 
                  onClick={() => product && toggleWishlist(product)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border transition-all duration-300 rounded flex-shrink-0 ${
                    product && isInWishlist(product.id) ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
                  }`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${product && isInWishlist(product.id) ? 'fill-red-500' : ''}`} />
                </button>
                <button 
                  className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-all duration-300 rounded flex-shrink-0">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            {/* WhatsApp Order Button */}
            <button onClick={handleWhatsAppOrder}
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs sm:text-sm tracking-wide sm:tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-md mb-6 sm:mb-8 rounded">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Order via WhatsApp</span>
            </button>

            {/* Features */}
            <div className="space-y-3 mb-8 p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Truck className="w-4 h-4 text-black" /><span>Fast & Secure Delivery Across India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-black" /><span>100% Authentic & Quality Assured</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Star className="w-4 h-4 text-black" /><span>Premium Long-Lasting Fragrances</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-6 mb-4 border-b border-gray-200">
                {['description', 'highlights', 'notes', 'reviews'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-900'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="text-gray-700 text-sm">
                {activeTab === 'description' && (
                  <p className="leading-relaxed">
                    {product.description || product.shortDescription || 'Product description coming soon.'}
                  </p>
                )}
                {activeTab === 'highlights' && (
                  product.highlights && product.highlights.length > 0 ? (
                    <ul className="space-y-3 list-disc list-inside">
                      {product.highlights.map((h, i) => <li key={i} className="text-gray-700"><span>{h}</span></li>)}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Product highlights coming soon.</p>
                  )
                )}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1 text-black">Top Notes</h4>
                      <p>{product.notes?.top || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-black">Heart Notes</h4>
                      <p>{product.notes?.heart || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-black">Base Notes</h4>
                      <p>{product.notes?.base || 'Not specified'}</p>
                    </div>
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Reviews Summary */}
                    {reviewStats.total > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">{reviewStats.avgRating}</div>
                            <div className="flex gap-0.5 justify-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-4 h-4 ${
                                    star <= Math.round(parseFloat(reviewStats.avgRating))
                                      ? 'fill-amber-500 text-amber-500'
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{reviewStats.total} reviews</div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = reviewStats.ratingDistribution?.[rating] || 0;
                              const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                              return (
                                <div key={rating} className="flex items-center gap-2 text-xs">
                                  <span className="w-3">{rating}</span>
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-amber-500 h-2 rounded-full transition-all" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="w-6 text-gray-500">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {reviewsLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading reviews...</span>
                      </div>
                    )}

                    {/* Reviews List */}
                    {!reviewsLoading && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review, idx) => (
                          <div key={review.id || idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start gap-3">
                              {/* User Avatar */}
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {(review.userName || 'A').charAt(0).toUpperCase()}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* Header: Name & Rating */}
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900">{review.userName || 'Anonymous'}</span>
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                      Verified Purchase
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {review.date ? new Date(review.date).toLocaleDateString('en-IN', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }) : ''}
                                  </span>
                                </div>
                                
                                {/* Star Rating */}
                                <div className="flex gap-0.5 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-4 h-4 ${
                                        star <= (review.rating || 0)
                                          ? 'fill-amber-500 text-amber-500'
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                
                                {/* Review Comment */}
                                {review.comment && (
                                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !reviewsLoading && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No reviews yet</p>
                        <p className="text-gray-400 text-sm mt-1">Be the first to review this product!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Star, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState(() => {
    // Initialize selectedSize based on product if available
    if (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes[0].value;
    }
    return product?.size || '120ML';
  });

  if (!product) return null;

  // Use sizes array from product if available, otherwise create from product.price
  let sizes = [];
  if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
    sizes = product.sizes;
  } else {
    // Default size based on product.size or '120ML'
    const defaultSize = product.size || '120ML';
    sizes = [
      { value: defaultSize, price: product.price, originalPrice: product.originalPrice || product.price }
    ];
  }

  // Update selectedSize when product changes
  useEffect(() => {
    if (product) {
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0].value);
      } else {
        setSelectedSize(product.size || '120ML');
      }
    }
  }, [product]);

  // Find price for selected size (case-insensitive matching)
  const normalizeSize = (size) => size?.toUpperCase().replace(/ML/g, 'ML');
  const selectedSizeObj = sizes.find(s => normalizeSize(s.value) === normalizeSize(selectedSize));
  const currentPrice = selectedSizeObj?.price || (sizes.length > 0 ? sizes[0].price : product.price);
  const images = product.images || [product.image];

  const nextImage = () => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize);
    onClose();
  };

  const handleWhatsAppOrder = () => {
    const message = `Hi, I want to order:\n\n*${product.name}*\nSize: ${selectedSize}\nQuantity: ${quantity}\nPrice: ₹${(currentPrice * quantity).toLocaleString('en-IN')}\n\nPlease confirm availability.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] shadow-2xl z-10 overflow-hidden">
        <button onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left Side - Product Image */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8 flex flex-col min-h-[400px]">
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
              {product.bestseller && (
                <div className="px-3 py-1.5 bg-black text-white text-xs font-bold tracking-wider">BESTSELLER</div>
              )}
              {product.tag && (
                <div className={`px-3 py-1.5 text-xs font-bold tracking-wider ${
                  product.tag === 'New' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                }`}>{product.tag}</div>
              )}
              {product.discount && (
                <div className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold tracking-wider">{product.discount}% OFF</div>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center relative group">
              <div className="relative w-full max-w-sm h-[300px] sm:h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden">
                <img 
                  src={images[selectedImage]} 
                  alt={product.name} 
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center shadow-lg" 
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-black hover:text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-black hover:text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-semibold z-10">
                      {selectedImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 border-2 transition-all duration-300 flex items-center justify-center overflow-hidden bg-white ${
                      selectedImage === idx ? 'border-gray-900 scale-105' : 'border-gray-200 hover:border-gray-500'
                    }`}>
                    <img src={img} alt={`View ${idx + 1}`} className="max-w-full max-h-full w-auto h-auto object-contain object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Details */}
          <div className="p-6 lg:mt-6 lg:p-8 flex flex-col overflow-y-auto max-h-[90vh]">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{product.category}</div>
            <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-3 tracking-tight">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4 lg:mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
              <span className="text-sm text-gray-400 ">({product.reviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-400 font-light">₹</span>
              <span className="text-3xl font-light text-gray-900">{currentPrice.toLocaleString('en-IN')}</span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <>
                  <span className="text-base text-gray-400 line-through font-light">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium">
                    {Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Product Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 lg:mt-3">
                <h3 className="font-semibold text-sm mb-2 text-gray-900">Product Highlights</h3>
                <ul className="space-y-1.5">
                  {product.highlights.slice(0, 3).map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size Selection */}
            {/* <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">SELECT SIZE</label>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <button key={size.value} onClick={() => setSelectedSize(size.value)}
                    className={`py-2.5 text-center border-2 transition-all duration-300 ${
                      selectedSize === size.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400 text-gray-900'
                    }`}>
                    <div className="font-semibold text-sm">{size.value}</div>
                    <div className="text-xs mt-0.5 opacity-80">₹{size.price.toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>
            </div> */}

            {/* Quantity Selector */}
            <div className="mb-4 lg:mt-3">
              <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">QUANTITY</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-gray-200">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-semibold border-x-2 border-gray-200 text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {quantity > 1 && (
                  <span className="text-xs text-gray-500">Total: ₹{(currentPrice * quantity).toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-3 lg:mt-6">
              <button onClick={handleAddToCart}
                className="flex-1 py-3 bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-500 transition-all duration-300 flex items-center justify-center gap-2 rounded-full">
                <ShoppingCart className="w-4 h-4" />ADD TO CART
              </button>
              <button onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 flex items-center justify-center border-2 transition-all duration-300 ${
                  isInWishlist(product.id) ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-900'
                }`}>
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
              </button>
              <button className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 hover:border-gray-900 transition-all duration-300">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Order Button */}
            <button onClick={handleWhatsAppOrder}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4" />
              Order via WhatsApp
            </button>

            {/* Shipping Info */}
            {/* <div className="space-y-2 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Truck className="w-4 h-4 text-gray-900" />
                <span>Free shipping on orders above ₹499</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield className="w-4 h-4 text-gray-900" />
                <span>100% Authentic & Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <RotateCcw className="w-4 h-4 text-gray-900" />
                <span>7 days easy return policy</span>
              </div>
            </div> */}

            {/* Tabs Section */}
            {/* <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-4 mb-3 border-b border-gray-200">
                {['description', 'highlights', 'notes'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-xs font-medium transition-colors capitalize ${
                      activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-900'
                    }`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                {activeTab === 'description' && (
                  <p>{product.description || 'Experience the luxurious blend of carefully selected ingredients that create this unique and captivating fragrance.'}</p>
                )}
                {activeTab === 'highlights' && (
                  <ul className="space-y-1.5">
                    {(product.highlights || ['Long-lasting fragrance', 'Premium quality ingredients', 'Perfect for all occasions']).map((h, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-black">✓</span>{h}</li>
                    ))}
                  </ul>
                )}
                {activeTab === 'notes' && product.notes && (
                  <div className="space-y-2">
                    <p><strong>Top:</strong> {product.notes.top}</p>
                    <p><strong>Heart:</strong> {product.notes.heart}</p>
                    <p><strong>Base:</strong> {product.notes.base}</p>
                  </div>
                )}
                {activeTab === 'notes' && !product.notes && (
                  <p>Fragrance notes information not available for this product.</p>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
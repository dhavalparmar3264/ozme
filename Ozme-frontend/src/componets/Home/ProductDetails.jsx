

import { useState } from 'react';
import { X, Plus, Minus, Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';

const ProductModal = ({ product, onClose, onAddToCart }) => {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('120ml');

    if (!product) return null;

    const sizes = [
        { value: '120ml', price: product.price * 1.8 }
    ];

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: product.description,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl z-10 overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-lg rounded-full sm:rounded-none"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
                    {/* Left Side - Product Image */}
                    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-4 flex flex-col max-h-[40vh] lg:max-h-none">
                        {/* Tag Badge */}
                        {product.tag && (
                            <div className={`absolute top-3 left-3 sm:top-6 sm:left-6 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold tracking-wider z-10 ${
                                product.tag === 'Bestseller' ? 'bg-black text-white' :
                                product.tag === 'New' ? 'bg-blue-600 text-white' :
                                'bg-purple-600 text-white'
                            }`}>
                                {product.tag}
                            </div>
                        )}

                        {/* Main Product Image */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <div className="relative w-full max-w-[200px] sm:max-w-xs lg:max-w-sm aspect-[3/4]">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Thumbnail Images - Hidden on small mobile */}
                        <div className="hidden sm:flex gap-2 mt-3 lg:mt-4 justify-center">
                            {[1, 2, 3].map((idx) => (
                                <div key={idx} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white border-2 border-gray-200 hover:border-gray-900 cursor-pointer transition-all duration-300 flex-shrink-0">
                                    <img
                                        src={product.image}
                                        alt={`View ${idx}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Product Details */}
                    <div className="p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto">
                        {/* Category */}
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                            {product.category}
                        </div>

                        {/* Product Name */}
                        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-light text-gray-900 mb-2 sm:mb-3 tracking-tight">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                            i < Math.floor(product.rating)
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">{product.rating}</span>
                            <span className="text-xs sm:text-sm text-gray-400">({product.reviews} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex flex-wrap items-baseline gap-2 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-gray-200">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs sm:text-sm text-gray-400 font-light">₹</span>
                                <span className="text-2xl sm:text-3xl font-light text-gray-900">
                                    {Math.round(sizes.find(s => s.value === selectedSize).price).toLocaleString('en-IN')}
                                </span>
                            </div>
                            {product.originalPrice && (
                                <>
                                    <span className="text-sm sm:text-base text-gray-400 line-through font-light">
                                        ₹{product.originalPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className="px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 text-xs font-medium">
                                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 sm:mb-5 font-light">
                            {product.description || 'Experience the luxurious blend of carefully selected ingredients that create this unique and captivating fragrance. Perfect for any occasion.'}
                        </p>

                        {/* Size Selection */}
                        <div className="mb-4 sm:mb-5">
                            <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">
                                SIZE
                            </label>
                            <div className="inline-block">
                                <div className="py-2 sm:py-3 px-6 sm:px-8 text-center border-2 border-gray-900 bg-gray-900 text-white">
                                    <div className="font-semibold text-xs sm:text-sm">120ml</div>
                                    <div className="text-xs mt-0.5 opacity-80">
                                        ₹{Math.round(sizes[0].price).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="mb-4 sm:mb-5">
                            <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">
                                QUANTITY
                            </label>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex items-center border-2 border-gray-200">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <span className="w-10 h-9 sm:w-12 sm:h-10 flex items-center justify-center font-semibold border-x-2 border-gray-200 text-xs sm:text-sm">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                                {quantity > 1 && (
                                    <span className="text-xs text-gray-500">
                                        Total: ₹{(Math.round(sizes.find(s => s.value === selectedSize).price) * quantity).toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto pt-2">
                            <button
                                onClick={() => onAddToCart(product, quantity)}
                                className="flex-1 py-2.5 sm:py-3 bg-black text-white font-semibold text-xs sm:text-sm hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                            >
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">ADD TO CART</span>
                                <span className="xs:hidden">ADD</span>
                            </button>
                            <button
                                onClick={() => toggleWishlist(product)}
                                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                                    isInWishlist(product.id)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 hover:border-gray-900'
                                }`}
                            >
                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
                            </button>
                            <button 
                                onClick={handleShare}
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-gray-300 hover:border-gray-900 transition-all duration-300 flex-shrink-0"
                            >
                                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
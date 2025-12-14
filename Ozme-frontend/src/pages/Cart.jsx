import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    ArrowRight,
    Shield,
    Truck,
    Gift,
    Tag,
    Sparkles,
    X
} from 'lucide-react';

export default function CartPage() {
    const navigate = useNavigate();
    const { cart, updateQuantity, removeFromCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromoCode, setAppliedPromoCode] = useState(null);
    const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
    const [promoCodeData, setPromoCodeData] = useState(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const handleApplyPromoCode = async () => {
        const code = promoCode.trim();
        
        if (!code) {
            toast.error('Please enter a promo code');
            return;
        }

        // Check if user is authenticated (required for backend validation)
        if (!isAuthenticated) {
            toast.error('Please login to apply promo codes');
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        setIsValidatingPromo(true);

        try {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shippingCost = 0;
            const orderAmount = subtotal + shippingCost;

            // Call backend API to validate coupon
            const response = await apiRequest('/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    orderAmount: orderAmount,
                }),
            });

            if (response && response.success) {
                const promoData = {
                    code: code.toUpperCase(),
                    discountAmount: response.data.discountAmount || 0,
                    data: response.data,
                };
                setAppliedPromoCode(code.toUpperCase());
                setPromoCodeDiscount(response.data.discountAmount || 0);
                setPromoCodeData(response.data);
                setPromoCode('');
                // Save to localStorage for checkout page
                localStorage.setItem('appliedPromoCode', JSON.stringify(promoData));
                toast.success(`Promo code "${code.toUpperCase()}" applied successfully!`);
            } else {
                const errorMessage = response?.message || 'Invalid promo code';
                toast.error(errorMessage);
                setAppliedPromoCode(null);
                setPromoCodeDiscount(0);
                setPromoCodeData(null);
                // Remove from localStorage on error
                localStorage.removeItem('appliedPromoCode');
            }
        } catch (error) {
            console.error('Promo code validation error:', error);
            const errorMessage = error.message || error.response?.data?.message || 'Failed to validate promo code';
            toast.error(errorMessage);
            setAppliedPromoCode(null);
            setPromoCodeDiscount(0);
            setPromoCodeData(null);
            // Remove from localStorage on error
            localStorage.removeItem('appliedPromoCode');
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const handleRemovePromoCode = () => {
        setAppliedPromoCode(null);
        setPromoCodeDiscount(0);
        setPromoCodeData(null);
        // Remove from localStorage
        localStorage.removeItem('appliedPromoCode');
        toast.success('Promo code removed');
    };
    // Hero Section
    const HeroSection = () => (
        <section className="relative -top-4 h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden bg-gray-900">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(https://i.pinimg.com/736x/28/a7/91/28a79150042f4b65d4d06a675e3bcdd8.jpg)'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
            </div>

            <div className="relative h-full flex items-center justify-center text-center px-3 sm:px-4 z-10 py-8 sm:py-12">
                <div className="max-w-4xl mt-20  xl:mt-48 2xl:mt-56 mx-auto w-full">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-6 md:mb-8">
                        <div className="h-px w-6 sm:w-8 md:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
                            <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase">Your Cart</span>
                        </div>
                        <div className="h-px w-6 sm:w-8 md:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl mb-4 sm:mb-5 md:mb-6">
                        <span className="block font-serif italic text-amber-300 mt-1 sm:mt-2">
                            Shopping Cart
                        </span>
                    </h1>

                    <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                        <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>
                    </div>

                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 mb-10">
                        Review and manage your selected fragrances
                    </p>
                </div>
            </div>
        </section>
    );


    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const savings = cart.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
    const shippingCost = 0; // Free shipping for all orders
    const cartTotalBeforeDiscount = subtotal + shippingCost;
    const discountAmount = promoCodeDiscount || 0; // Use backend calculated discount
    const total = cartTotalBeforeDiscount - discountAmount;

    // Empty State
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <HeroSection />
                <div className="max-w-2xl mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-24 text-center">
                    <div className="mb-6 sm:mb-8 flex justify-center">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 flex items-center justify-center">
                            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3 sm:mb-4">
                        Your Cart is Empty
                    </h2>

                    <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-md mx-auto leading-relaxed px-2">
                        Looks like you haven't added any items to your cart yet
                    </p>

                    <button 
                        onClick={() => navigate('/shop')}
                        className="group px-6 sm:px-10 md:px-12 py-3 sm:py-4 text-sm sm:text-base bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-2 sm:gap-3 mx-auto"
                    >
                        Continue Shopping
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <HeroSection />
            {/* Header Section */}


            {/* Main Content */}
            <section className="py-8 sm:py-12 md:py-16 relative">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Cart Items - Left Column */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="group bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6">
                                        {/* Product Image */}
                                        <div className="relative w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 flex-shrink-0 overflow-hidden bg-gray-50">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            {/* Top Section */}
                                            <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1 sm:mb-2">
                                                        {item.category}
                                                    </span>
                                                    <h3 className="text-base sm:text-lg md:text-xl font-light text-gray-900 group-hover:text-amber-600 transition-colors duration-300 break-words">
                                                        {item.name}
                                                        {item.size && (
                                                            <span className="ml-2 text-sm font-normal text-gray-500">
                                                                ({item.size})
                                                            </span>
                                                        )}
                                                    </h3>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.size)}
                                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 flex-shrink-0"
                                                    title="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>

                                            {/* Price & Savings */}
                                            <div className="mb-3 sm:mb-4">
                                                <div className="flex items-baseline gap-2 sm:gap-3 mb-1 flex-wrap">
                                                    <span className="text-xl sm:text-2xl font-light text-gray-900">
                                                        ₹{item.price.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                        ₹{item.originalPrice.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <span className="inline-block px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium">
                                                    You save ₹{(item.originalPrice - item.price).toLocaleString('en-IN')}
                                                </span>
                                            </div>

                                            {/* Bottom Section - Quantity & Subtotal */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-auto">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                                                        className="p-2 sm:p-3 hover:bg-gray-50 transition-colors duration-200"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                                                    </button>
                                                    <span className="px-4 sm:px-6 py-1.5 sm:py-2 font-semibold text-sm sm:text-base text-gray-900 min-w-[50px] sm:min-w-[60px] text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                                        className="p-2 sm:p-3 hover:bg-gray-50 transition-colors duration-200"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                                                    </button>
                                                </div>

                                                {/* Item Subtotal */}
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Subtotal</p>
                                                    <p className="text-xl sm:text-2xl font-light text-gray-900">
                                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Continue Shopping */}
                            <button 
                                onClick={() => navigate('/shop')}
                                className="w-full py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Continue Shopping
                            </button>
                        </div>

                        {/* Order Summary - Right Column */}
                        <div className="lg:col-span-1 order-1 lg:order-2">
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4 sm:p-6 md:p-8 sticky top-4 sm:top-6 md:top-24 shadow-lg">
                                {/* Title */}
                                <div className="mb-6 sm:mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                        <h2 className="text-xl sm:text-2xl font-light text-gray-900">Order Summary</h2>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent"></div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                        <span className="font-light">Subtotal ({cart.length} items)</span>
                                        <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                        <span className="font-light">Your Savings</span>
                                        <span className="font-semibold text-green-600">-₹{savings.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                        <span className="font-light">Shipping</span>
                                        <span className={`font-semibold ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                                            {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                                        </span>
                                    </div>

                                    {/* Discount Line */}
                                    {appliedPromoCode && discountAmount > 0 && (
                                        <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                            <span className="font-light">Discount ({appliedPromoCode})</span>
                                            <span className="font-semibold text-green-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}


                                    {/* Total */}
                                    <div className="border-t-2 border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <span className="text-lg sm:text-xl font-light text-gray-900">Total</span>
                                            <div className="text-right">
                                                <div className="flex items-baseline gap-1 sm:gap-2">
                                                    <span className="text-xs sm:text-sm text-gray-500">₹</span>
                                                    <span className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900">
                                                        {total.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Inclusive of all taxes</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3 sm:py-4 text-sm sm:text-base bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                {/* Features */}
                                <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        <span className="font-light">100% Secure Payment</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        <span className="font-light">Free shipping on all orders</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        <span className="font-light">Complimentary gift wrapping</span>
                                    </div>
                                </div>

                                {/* Promo Code */}
                                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                        <span className="text-xs sm:text-sm font-semibold text-gray-900">Have a Promo Code?</span>
                                    </div>
                                    {appliedPromoCode ? (
                                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <span className="text-xs sm:text-sm font-semibold text-green-700">{appliedPromoCode.toUpperCase()}</span>
                                                <span className="text-[10px] sm:text-xs text-green-600">Applied</span>
                                            </div>
                                            <button
                                                onClick={handleRemovePromoCode}
                                                className="p-1 hover:bg-green-100 rounded-full transition-colors flex-shrink-0"
                                                title="Remove promo code"
                                            >
                                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-700" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter code"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleApplyPromoCode();
                                                    }
                                                }}
                                                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                                            />
                                            <button
                                                onClick={handleApplyPromoCode}
                                                disabled={isValidatingPromo || !promoCode.trim()}
                                                className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isValidatingPromo ? 'Validating...' : 'Apply'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
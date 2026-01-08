import { useState } from 'react';
import { Heart, ShoppingCart, X, Star, Sparkles, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { showInfoToast } from '../utils/toast';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [hoveredProduct, setHoveredProduct] = useState(null);

    const handleAddToCart = (product) => {
        // Ensure product has all required fields for cart
        const cartProduct = {
            ...product,
            images: product.image ? [product.image] : product.images || [],
            gender: product.gender || (product.category?.toLowerCase().includes('men') ? 'men' : product.category?.toLowerCase().includes('women') ? 'women' : 'unisex')
        };
        addToCart(cartProduct, 1, '120ml');
    };

    const moveAllToCart = () => {
        wishlist.forEach(product => {
            addToCart(product, 1, '120ml');
        });
    };

    const handleShareWishlist = async () => {
        // Generate shareable link with product IDs
        const productIds = wishlist.map(product => product.id || product._id).filter(Boolean);
        
        if (productIds.length === 0) {
            showInfoToast('Your wishlist is empty');
            return;
        }

        // Create shareable URL with product IDs as query parameters
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/wishlist?products=${productIds.join(',')}`;
        
        const shareData = {
            title: 'My Wishlist - OZME Perfumes',
            text: `Check out my wishlist with ${wishlist.length} ${wishlist.length === 1 ? 'product' : 'products'}!`,
            url: shareUrl,
        };

        // Try Web Share API first (mobile)
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (error) {
                // User cancelled or error occurred, fall through to clipboard
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            showInfoToast('Wishlist link copied!');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showInfoToast('Wishlist link copied!');
            } catch (err) {
                console.error('Failed to copy:', err);
                showInfoToast('Failed to copy link. Please try again.');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    // Empty State
    if (wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                {/* Header Background Spacer - Ensures logo visibility */}
                <div className="h-24 bg-white"></div>
                
                {/* Header with Solid Background */}
                <div className="relative bg-white py-20 overflow-hidden">
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-400"></div>
                            <Heart className="w-6 h-6 text-rose-500" />
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-400"></div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-light text-gray-900 text-center tracking-tight">
                            My Wishlist
                        </h1>
                    </div>
                </div>

                {/* Empty State Content */}
                <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center">
                            <Heart className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                        Your Wishlist is Empty
                    </h2>

                    <p className="text-lg text-gray-600 mb-12 max-w-md mx-auto leading-relaxed">
                        Save your favorite fragrances here and never lose track of the scents you love
                    </p>

                    <Link to="/shop" className="group px-12 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 mx-auto">
                        Explore Fragrances
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header Background Spacer - Ensures logo visibility on all screen sizes */}
            <div className="h-24 bg-white w-full"></div>
            
            {/* Hero Section */}
            <section className="relative h-[70vh] overflow-hidden bg-gray-900">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url(https://i.pinimg.com/736x/cf/49/82/cf49824e19dfcd32755c5df196806976.jpg)'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
                </div>

                <div className="relative h-full flex items-center justify-center text-center px-4 z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                                <Heart className="w-4 h-4 text-amber-300" />
                                <span className="text-xs font-semibold text-white tracking-[0.2em] uppercase">Your Wishlist</span>
                            </div>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6">
                            {/* <span className="block text-white font-light tracking-tight">
                                My
                            </span> */}
                            <span className="block font-serif italic text-amber-300 mt-2">
                                Wishlist
                            </span>
                        </h1>

                        <div className="flex justify-center mb-8">
                            <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>
                        </div>

                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light mb-8">
                            Your curated collection of favorite fragrances
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={moveAllToCart}
                                className="px-8 py-3 bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Add All to Cart
                            </button>
                            <button 
                                onClick={handleShareWishlist}
                                className="px-8 py-3 border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                            >
                                Share Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Header Section */}
           
            {/* Products Grid */}
            <section className="py-24 relative overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wishlist.map((product) => (
                            <div
                                key={product.id}
                                className="group"
                                onMouseEnter={() => setHoveredProduct(product.id)}
                                onMouseLeave={() => setHoveredProduct(null)}
                            >
                                <div className="relative">
                                    {/* Product Image Container */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-md group-hover:shadow-2xl transition-all duration-500">
                                        <img
                                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/400x600?text=No+Image'}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x600?text=No+Image';
                                            }}
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

                                        {/* Remove from Wishlist Button */}
                                        <button
                                            onClick={() => removeFromWishlist(product.id)}
                                            className="absolute top-4 right-4 w-11 h-11 bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-rose-50 hover:scale-110 transition-all duration-300 group/remove"
                                        >
                                            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 group-hover/remove:scale-110 transition-transform" />
                                        </button>

                                        {/* Add to Cart Button */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-full py-3 bg-white text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl"
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

                                        {/* Price Section */}
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

                                        {/* Discount Badge */}
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium tracking-wide">
                                                Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Add to Cart Button - Visible on mobile only */}
                                    <div className="mt-4 md:hidden">
                                        <button 
                                            onClick={() => handleAddToCart(product)}
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
                </div>
            </section>

            {/* Recommendations Section */}
            <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
                        You Might Also
                        <span className="block font-serif italic text-gray-800 mt-2">Love These</span>
                    </h2>

                    <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover more fragrances that complement your favorites
                    </p>

                    <button className="group px-12 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 mx-auto">
                        Explore Similar Scents
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>
                </div>
            </section>
        </div>
    );
}
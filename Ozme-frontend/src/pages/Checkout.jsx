import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard,
    Lock,
    MapPin,
    User,
    Mail,
    Phone,
    Home,
    Building2,
    Calendar,
    Shield,
    Truck,
    CheckCircle2,
    ArrowLeft,
    Sparkles,
    Wallet,
    Plus,
    X,
    Check,
    Trash2,
    Edit3,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { generateOrderId } from '../utils/generateOrderId';
import { getStates, getCitiesByState } from '../utils/indianLocations';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { cart, clearCart, removeFromCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const [step, setStep] = useState('shipping'); // 'shipping', 'payment', 'review'
    const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'ONLINE'
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        // Shipping Info
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        pincode: '',
        
        // Payment Info (only for online payment)
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        
        // Options
        saveInfo: false,
        newsletter: false
    });

    const [orderComplete, setOrderComplete] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    
    // Promo code state
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromoCode, setAppliedPromoCode] = useState(null);
    const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
    const [promoCodeData, setPromoCodeData] = useState(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    // Reset order state function (only resets order-related state, not checkout form)
    const resetOrderState = () => {
        setOrderComplete(false);
        setOrderDetails(null);
        setIsProcessing(false);
        // Clear previous order from localStorage
        localStorage.removeItem('currentOrder');
    };

    // Save order to allOrders array in localStorage
    const saveOrderToHistory = (orderData) => {
        try {
            const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
            // Add new order to the beginning of the array
            allOrders.unshift(orderData);
            // Keep only last 100 orders to prevent localStorage from getting too large
            const trimmedOrders = allOrders.slice(0, 100);
            localStorage.setItem('allOrders', JSON.stringify(trimmedOrders));
        } catch (error) {
            console.error('Error saving order to history:', error);
        }
    };
    const [newAddress, setNewAddress] = useState({
        type: 'Home',
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false,
    });
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [isDeletingAddress, setIsDeletingAddress] = useState(null);
    const [availableCities, setAvailableCities] = useState([]);
    const [formCities, setFormCities] = useState([]);
    const [availableStates] = useState(getStates());
    const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);

    // Use cart from context
    const cartItems = cart.length > 0 ? cart : [];
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const shippingCost = 0;
    const discountAmount = promoCodeDiscount || 0;
    const total = Math.max(0, subtotal + shippingCost - discountAmount);

    // Load applied promo code from localStorage (from cart page)
    useEffect(() => {
        try {
            const savedPromo = localStorage.getItem('appliedPromoCode');
            if (savedPromo) {
                const promoData = JSON.parse(savedPromo);
                setAppliedPromoCode(promoData.code);
                setPromoCodeDiscount(promoData.discountAmount || 0);
                setPromoCodeData(promoData.data);
            }
        } catch (error) {
            console.error('Error loading promo code from localStorage:', error);
            localStorage.removeItem('appliedPromoCode');
        }
    }, []);

    // Check phone verification status
    useEffect(() => {
        if (isAuthenticated && user && !user.phoneVerified) {
            setShowPhoneVerificationModal(true);
        }
    }, [isAuthenticated, user]);

    // Fetch user profile and addresses when logged in
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthenticated || !user) return;

            setIsLoadingAddresses(true);
            try {
                // Fetch user profile
                const profileResponse = await apiRequest('/auth/me');
                if (profileResponse && profileResponse.success) {
                    const userData = profileResponse.data.user;
                    // Prefill form with user profile data
                    setFormData(prev => ({
                        ...prev,
                        firstName: userData.firstName || (userData.name ? userData.name.split(' ')[0] : '') || prev.firstName,
                        lastName: userData.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : '') || prev.lastName,
                        email: userData.email || prev.email,
                        phone: userData.phone || prev.phone,
                    }));
                }

                // Fetch saved addresses
                const addressesResponse = await apiRequest('/users/me/addresses');
                if (addressesResponse && addressesResponse.success) {
                    const addresses = addressesResponse.data.addresses || [];
                    setSavedAddresses(addresses);
                    
                    // Select default address or first address
                    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
                    if (defaultAddress) {
                        handleSelectAddress(defaultAddress);
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        loadUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user]);

    // Handle address selection
    const handleSelectAddress = (address) => {
        setSelectedAddressId(address._id || address.id);
        // Split name into first and last name
        const nameParts = (address.name || '').split(' ');
        setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(' ') || prev.lastName,
            phone: address.phone || prev.phone,
            address: address.address || '',
            apartment: '', // Address model doesn't have apartment field
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
        }));
        // Set available cities for the selected address state
        if (address.state) {
            const cities = getCitiesByState(address.state);
            setFormCities(cities);
        }
        setShowAddAddressForm(false);
    };

    // Handle state change for new address form - update available cities
    const handleStateChange = (stateName) => {
        setNewAddress({ ...newAddress, state: stateName, city: '' });
        const cities = getCitiesByState(stateName);
        setAvailableCities(cities);
    };

    // Handle state change for main form - update available cities
    const handleFormStateChange = (stateName) => {
        setFormData(prev => ({ ...prev, state: stateName, city: '' }));
        const cities = getCitiesByState(stateName);
        setFormCities(cities);
    };

    // Handle add new address
    const handleAddNewAddress = async () => {
        setIsSavingAddress(true);

        try {
            // Combine firstName and lastName into name for backend
            const addressToSave = {
                ...newAddress,
                name: `${formData.firstName} ${formData.lastName}`.trim() || newAddress.name,
                phone: formData.phone || newAddress.phone,
            };

            const isEditing = editingAddressId !== null;
            const url = isEditing 
                ? `/users/me/addresses/${editingAddressId}`
                : '/users/me/addresses';
            
            const response = await apiRequest(url, {
                method: isEditing ? 'PUT' : 'POST',
                body: JSON.stringify(addressToSave),
            });

            if (response && response.success) {
                if (isEditing) {
                    // Update existing address in list
                    setSavedAddresses(prev => prev.map(addr => 
                        (addr._id || addr.id) === editingAddressId 
                            ? response.data.address 
                            : addr
                    ));
                    toast.success('Address updated successfully!');
                } else {
                    // Add new address to list
                    const addedAddress = response.data.address;
                    setSavedAddresses(prev => [...prev, addedAddress]);
                    handleSelectAddress(addedAddress);
                    toast.success('Address saved successfully!');
                }
                
                setShowAddAddressForm(false);
                setEditingAddressId(null);
                setNewAddress({
                    type: 'Home',
                    name: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                    isDefault: false,
                });
                setAvailableCities([]);
            } else {
                throw new Error(response?.message || 'Failed to save address');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error(error.message || 'Failed to save address. Please try again.');
        } finally {
            setIsSavingAddress(false);
        }
    };

    // Handle edit address
    const handleEditAddress = (address, e) => {
        e.stopPropagation(); // Prevent selecting the address
        setEditingAddressId(address._id || address.id);
        
        // Parse name into firstName and lastName
        const nameParts = (address.name || '').split(' ');
        setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: address.phone || '',
        }));
        
        setNewAddress({
            type: address.type || 'Home',
            name: address.name || '',
            phone: address.phone || '',
            address: address.address || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'India',
            isDefault: address.isDefault || false,
        });
        
        // Set available cities for the state
        const cities = getCitiesByState(address.state);
        setAvailableCities(cities);
        
        setShowAddAddressForm(true);
    };

    // Handle delete address
    const handleDeleteAddress = async (addressId, e) => {
        e.stopPropagation(); // Prevent selecting the address
        
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }
        
        setIsDeletingAddress(addressId);
        
        try {
            const response = await apiRequest(`/users/me/addresses/${addressId}`, {
                method: 'DELETE',
            });
            
            if (response && response.success) {
                setSavedAddresses(prev => prev.filter(addr => (addr._id || addr.id) !== addressId));
                
                // If deleted address was selected, clear selection
                if (selectedAddressId === addressId) {
                    setSelectedAddressId(null);
                    setFormData(prev => ({
                        ...prev,
                        address: '',
                        city: '',
                        state: '',
                        pincode: '',
                    }));
                }
                
                toast.success('Address deleted successfully!');
            } else {
                throw new Error(response?.message || 'Failed to delete address');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error(error.message || 'Failed to delete address');
        } finally {
            setIsDeletingAddress(null);
        }
    };

    // Redirect if cart is empty
    if (cartItems.length === 0 && !orderComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle promo code validation
    const handleApplyPromoCode = async () => {
        const code = promoCode.trim();
        
        if (!code) {
            toast.error('Please enter a promo code');
            return;
        }

        // Check if user is authenticated (required for backend validation)
        if (!isAuthenticated) {
            toast.error('Please login to apply promo codes');
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        setIsValidatingPromo(true);

        try {
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
                setAppliedPromoCode(code.toUpperCase());
                setPromoCodeDiscount(response.data.discountAmount || 0);
                setPromoCodeData(response.data);
                setPromoCode('');
                toast.success(`Promo code "${code.toUpperCase()}" applied successfully!`);
            } else {
                const errorMessage = response?.message || 'Invalid promo code';
                toast.error(errorMessage);
                setAppliedPromoCode(null);
                setPromoCodeDiscount(0);
                setPromoCodeData(null);
            }
        } catch (error) {
            console.error('Promo code validation error:', error);
            toast.error(error.message || 'Failed to validate promo code');
            setAppliedPromoCode(null);
            setPromoCodeDiscount(0);
            setPromoCodeData(null);
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const handleRemovePromoCode = () => {
        setAppliedPromoCode(null);
        setPromoCodeDiscount(0);
        setPromoCodeData(null);
        setPromoCode('');
        // Remove from localStorage
        localStorage.removeItem('appliedPromoCode');
        toast.success('Promo code removed');
    };

    // Validate shipping form
    const validateShipping = () => {
        const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
        for (const field of required) {
            if (!formData[field] || formData[field].trim() === '') {
                toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return false;
        }
        if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            toast.error('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!/^[0-9]{6}$/.test(formData.pincode)) {
            toast.error('Please enter a valid 6-digit PIN code');
            return false;
        }
        return true;
    };

    // Handle Razorpay online payment
    const handleOnlinePayment = async () => {
        try {
            setIsProcessing(true);

            // Check if user is authenticated
            if (!isAuthenticated || !user) {
                toast.error('Please login to place an order');
                navigate('/login', { state: { from: '/checkout' } });
                return;
            }

            // Check if cart is empty
            if (cartItems.length === 0) {
                toast.error('Your cart is empty');
                navigate('/cart');
                return;
            }

            // Filter and validate cart items - remove items with invalid IDs
            const validCartItems = [];
            const invalidCartItems = [];
            
            cartItems.forEach(item => {
                // Check if item.id is a valid MongoDB ObjectId (24 hex characters)
                const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(item.id?.toString());
                
                if (isValidObjectId) {
                    validCartItems.push(item);
                } else {
                    invalidCartItems.push(item);
                    console.warn(`Invalid product ID in cart: ${item.id} for product: ${item.name}`);
                }
            });
            
            // If there are invalid items, remove them from cart and show error
            if (invalidCartItems.length > 0) {
                invalidCartItems.forEach(item => {
                    removeFromCart(item.id);
                });
                
                const invalidNames = invalidCartItems.map(item => item.name).join(', ');
                toast.error(
                    `Some items in your cart have invalid IDs and have been removed: ${invalidNames}. Please add them again from the shop.`,
                    { duration: 6000 }
                );
                
                if (validCartItems.length === 0) {
                    setIsProcessing(false);
                    navigate('/cart');
                    return;
                }
                
                toast.info(`Proceeding with ${validCartItems.length} valid item(s) in your cart.`, { duration: 4000 });
            }
            
            // Check if we have any valid items left
            if (validCartItems.length === 0) {
                toast.error('Your cart is empty. Please add products from the shop.');
                navigate('/cart');
                return;
            }
            
            // Map valid cart items to backend format
            const orderItems = validCartItems.map(item => ({
                productId: item.id.toString(),
                quantity: item.quantity || 1,
                size: item.size || '100ml',
                price: item.price,
            }));

            // Prepare shipping address
            const shippingAddress = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone,
                address: `${formData.address}${formData.apartment ? ', ' + formData.apartment : ''}`,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: 'India',
            };

            // Step 1: Create order with backend first
            const orderResponse = await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    items: orderItems,
                    shippingAddress: shippingAddress,
                    paymentMethod: 'Prepaid',
                    promoCode: appliedPromoCode,
                    discountAmount: discountAmount,
                    totalAmount: total,
                }),
            });

            if (!orderResponse || !orderResponse.success) {
                throw new Error(orderResponse?.message || 'Failed to create order');
            }

            const backendOrder = orderResponse.data.order;
            const orderId = backendOrder._id;

            // Step 2: Create Razorpay payment order
            const razorpayResponse = await apiRequest('/payments/razorpay/create-order', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: orderId,
                    amount: total,
                }),
            });

            if (!razorpayResponse || !razorpayResponse.success) {
                throw new Error(razorpayResponse?.message || 'Failed to create payment order');
            }

            const { orderId: razorpayOrderId, amount: razorpayAmount, currency, keyId } = razorpayResponse.data;

            // Step 3: Function to open Razorpay checkout
            const openRazorpayCheckout = () => {
                const options = {
                    key: keyId,
                    amount: razorpayAmount, // Amount is in paise (already converted by backend)
                    currency: currency || 'INR',
                    name: 'OZME Perfumes',
                    description: `Order #${backendOrder.orderNumber}`,
                    order_id: razorpayOrderId,
                    handler: async function (response) {
                        // Payment successful - verify payment signature
                        try {
                            setIsProcessing(true);
                            
                            const verifyResponse = await apiRequest('/payments/razorpay/verify', {
                                method: 'POST',
                                body: JSON.stringify({
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature,
                                    orderId: orderId,
                                }),
                            });

                            if (verifyResponse && verifyResponse.success) {
                                // Clear cart after successful payment
                                clearCart();
                                
                                // Clear applied promo code from localStorage
                                localStorage.removeItem('appliedPromoCode');
                                
                                // Show success message
                                toast.success('Payment successful! Your order has been placed.');
                                
                                // Redirect to track order page
                                navigate('/track-order', {
                                    state: {
                                        orderId: orderId,
                                        timestamp: Date.now(),
                                    },
                                });
                            } else {
                                throw new Error(verifyResponse?.message || 'Payment verification failed');
                            }
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            toast.error(error.message || 'Payment verification failed. Please contact support.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    prefill: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        contact: formData.phone,
                    },
                    notes: {
                        order_id: orderId,
                        order_number: backendOrder.orderNumber,
                    },
                    theme: {
                        color: '#000000',
                    },
                    modal: {
                        ondismiss: function() {
                            // User closed the payment modal
                            setIsProcessing(false);
                            toast.info('Payment cancelled');
                        },
                    },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.on('payment.failed', function (response) {
                    console.error('Payment failed:', response.error);
                    toast.error(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`);
                    setIsProcessing(false);
                });

                razorpay.open();
            };

            // Step 4: Load Razorpay Checkout SDK and open payment window
            // Check if script is already loaded
            if (window.Razorpay) {
                // SDK already loaded, proceed directly
                openRazorpayCheckout();
            } else {
                // Load SDK
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => {
                    openRazorpayCheckout();
                };
                script.onerror = () => {
                    setIsProcessing(false);
                    toast.error('Failed to load Razorpay SDK. Please refresh the page and try again.');
                };
                document.body.appendChild(script);
            }

        } catch (error) {
            console.error('Online payment error:', error);
            toast.error(error.message || 'Payment initialization failed. Please try again.');
            setIsProcessing(false);
        }
    };

    // Handle COD order placement
    const handleCODOrder = async () => {
        try {
            setIsProcessing(true);

            // Check if user is authenticated
            if (!isAuthenticated || !user) {
                toast.error('Please login to place an order');
                navigate('/login', { state: { from: '/checkout' } });
                return;
            }

            // Check if cart is empty
            if (cartItems.length === 0) {
                toast.error('Your cart is empty');
                navigate('/cart');
                return;
            }

            // Filter and validate cart items - remove items with invalid IDs
            const validCartItems = [];
            const invalidCartItems = [];
            
            cartItems.forEach(item => {
                // Check if item.id is a valid MongoDB ObjectId (24 hex characters)
                const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(item.id?.toString());
                
                if (isValidObjectId) {
                    validCartItems.push(item);
                } else {
                    invalidCartItems.push(item);
                    console.warn(`Invalid product ID in cart: ${item.id} for product: ${item.name}`);
                }
            });
            
            // If there are invalid items, remove them from cart and show error
            if (invalidCartItems.length > 0) {
                // Remove invalid items from cart
                invalidCartItems.forEach(item => {
                    removeFromCart(item.id);
                });
                
                const invalidNames = invalidCartItems.map(item => item.name).join(', ');
                toast.error(
                    `Some items in your cart have invalid IDs and have been removed: ${invalidNames}. Please add them again from the shop.`,
                    { duration: 6000 }
                );
                
                // If all items are invalid, redirect to cart
                if (validCartItems.length === 0) {
                    setIsProcessing(false);
                    navigate('/cart');
                    return;
                }
                
                // If some items are valid, continue with valid items only
                toast.info(`Proceeding with ${validCartItems.length} valid item(s) in your cart.`, { duration: 4000 });
            }
            
            // Check if we have any valid items left
            if (validCartItems.length === 0) {
                toast.error('Your cart is empty. Please add products from the shop.');
                navigate('/cart');
                return;
            }
            
            // Map valid cart items to backend format
            const orderItems = validCartItems.map(item => ({
                productId: item.id.toString(), // Ensure it's a string
                quantity: item.quantity || 1,
                size: item.size || '100ml',
                price: item.price,
            }));

            // Prepare shipping address
            const shippingAddress = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone,
                address: `${formData.address}${formData.apartment ? ', ' + formData.apartment : ''}`,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: 'India',
            };

            // Call backend API to create order
            const orderResponse = await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    items: orderItems,
                    shippingAddress: shippingAddress,
                    paymentMethod: 'COD',
                    promoCode: appliedPromoCode,
                    discountAmount: discountAmount,
                    totalAmount: total,
                }),
            });

            if (!orderResponse || !orderResponse.success) {
                throw new Error(orderResponse?.message || 'Failed to create order');
            }

            const backendOrder = orderResponse.data.order;
            
            // Create frontend order data for localStorage (as backup)
            const frontendOrderData = {
                orderId: backendOrder._id || backendOrder.orderNumber,
                backendOrderId: backendOrder._id,
                orderNumber: backendOrder.orderNumber,
                orderDate: backendOrder.createdAt || new Date().toISOString(),
                status: backendOrder.orderStatus || 'Processing',
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size || '100ml',
                    category: item.category || 'Perfume'
                })),
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    apartment: formData.apartment || '',
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                paymentMethod: 'COD',
                paymentStatus: backendOrder.paymentStatus || 'Pending',
                subtotal: subtotal,
                shippingCost: shippingCost,
                totalAmount: backendOrder.totalAmount || total,
            };
            
            // Store order data in localStorage as backup
            localStorage.setItem('currentOrder', JSON.stringify(frontendOrderData));
            
            // Save order to order history
            saveOrderToHistory(frontendOrderData);
            
            // Clear cart after order is placed
            clearCart();
            
            // Clear applied promo code from localStorage
            localStorage.removeItem('appliedPromoCode');
            
            // Show success message
            toast.success('Your Cash on Delivery order has been placed successfully!');
            
            // Redirect to track order page with backend order ID
            navigate('/track-order', { 
                state: { 
                    orderId: backendOrder._id || backendOrder.orderNumber,
                    timestamp: Date.now() 
                } 
            });
        } catch (error) {
            console.error('COD order error:', error);
            const errorMessage = error.message || error.response?.data?.message || 'Failed to place order. Please try again.';
            toast.error(errorMessage);
            
            // If it's an auth error, redirect to login
            if (error.response?.status === 401 || errorMessage.includes('Authentication')) {
                navigate('/login', { state: { from: '/checkout' } });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (step === 'shipping') {
            if (!validateShipping()) {
                return;
            }
            setStep('payment');
        } else if (step === 'payment') {
            setStep('review');
        } else if (step === 'review') {
            // Place order based on payment method
            if (paymentMethod === 'COD') {
                await handleCODOrder();
            } else {
                // Handle Razorpay online payment
                await handleOnlinePayment();
            }
        }
    };

    // Hero Section
    const HeroSection = () => (
        <section className="relative h-[50vh] -top-3 overflow-hidden bg-gray-900">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(https://i.pinimg.com/736x/28/a7/91/28a79150042f4b65d4d06a675e3bcdd8.jpg)'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
            </div>

            <div className="relative h-full flex items-center justify-center text-center px-4 z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                            <Lock className="w-4 h-4 text-amber-300" />
                            <span className="text-xs font-semibold text-white tracking-[0.2em] uppercase">Secure Checkout</span>
                        </div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl mb-4">
                        <span className="block font-serif italic text-amber-300">
                            Complete Your Order
                        </span>
                    </h1>

                    <div className="flex justify-center mb-6">
                        <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>
                    </div>

                    <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
                        Just a few more steps to elevate your fragrance collection
                    </p>
                </div>
            </div>
        </section>
    );

    // Order Complete State
    if (orderComplete) {
        return (
            <div className="min-h-screen bg-gray-50">
                <HeroSection />
                <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                            <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
                        Order Confirmed!
                    </h2>

                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                        {orderDetails?.paymentMethod === 'COD' 
                            ? "Your Cash on Delivery order has been placed successfully! We've sent a confirmation email to"
                            : "Thank you for your purchase. We've sent a confirmation email to"
                        } <strong>{formData.email || orderDetails?.shippingAddress?.email}</strong>
                    </p>

                    <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 max-w-md mx-auto">
                        <p className="text-sm text-gray-500 mb-2">Order Number</p>
                        <p className="text-2xl font-light text-gray-900 mb-4">
                            {orderDetails?.orderNumber || orderDetails?._id || `#ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">Total Amount</p>
                        <p className="text-3xl font-light text-gray-900">₹{(orderDetails?.totalAmount || total).toLocaleString('en-IN')}</p>
                        {orderDetails?.paymentMethod === 'COD' && (
                            <p className="text-sm text-amber-600 mt-2 font-medium">Payment: Cash on Delivery</p>
                        )}
                    </div>

                    <div className="space-y-4 max-w-md mx-auto mb-12">
                        <div className="flex items-center gap-3 text-left p-4 bg-white border border-gray-200 rounded-lg">
                            <Truck className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">Estimated Delivery</p>
                                <p className="text-sm text-gray-600">3-5 Business Days</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/shop')}
                        className="px-12 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Phone Verification Modal */}
            {showPhoneVerificationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Phone Verification Required</h3>
                                    <p className="text-blue-100 text-sm">Complete this step to place your order</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Why is this required?</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        We need your verified phone number to contact you about your order delivery 
                                        and to ensure secure transactions. This is a one-time verification.
                                    </p>
                                </div>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-6">
                                Please verify your phone number in your profile to continue with checkout. 
                                Once verified, you won't need to do this again.
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/dashboard?tab=profile&verify=phone&from=checkout')}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Verify Phone Now
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPhoneVerificationModal(false);
                                        navigate('/cart');
                                    }}
                                    className="px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <HeroSection />

            {/* Progress Steps */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Step 1 */}
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                                step === 'shipping' ? 'border-black bg-black text-white' : 
                                'border-green-500 bg-green-500 text-white'
                            }`}>
                                {step !== 'shipping' ? <CheckCircle2 className="w-6 h-6" /> : '1'}
                            </div>
                            <span className="ml-3 text-sm font-semibold text-gray-900 hidden sm:block">Shipping</span>
                        </div>

                        <div className="h-px w-12 sm:w-24 bg-gray-300"></div>

                        {/* Step 2 */}
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                                step === 'payment' ? 'border-black bg-black text-white' : 
                                step === 'review' ? 'border-green-500 bg-green-500 text-white' :
                                'border-gray-300 bg-white text-gray-400'
                            }`}>
                                {step === 'review' ? <CheckCircle2 className="w-6 h-6" /> : '2'}
                            </div>
                            <span className="ml-3 text-sm font-semibold text-gray-900 hidden sm:block">Payment</span>
                        </div>

                        <div className="h-px w-12 sm:w-24 bg-gray-300"></div>

                        {/* Step 3 */}
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                                step === 'review' ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-400'
                            }`}>
                                3
                            </div>
                            <span className="ml-3 text-sm font-semibold text-gray-900 hidden sm:block">Review</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Form */}
                        <div className="lg:col-span-2">
                            <button 
                                onClick={() => {
                                    if (step === 'payment') setStep('shipping');
                                    else if (step === 'review') setStep('payment');
                                }}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-300"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back</span>
                            </button>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Shipping Information */}
                                {step === 'shipping' && (
                                    <div className="space-y-6">
                                        {/* Saved Addresses Selection (only for logged-in users) */}
                                        {isAuthenticated && (
                                            <div className="bg-white border border-gray-100 shadow-sm p-8">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-6 h-6 text-amber-600" />
                                                        <h2 className="text-2xl font-light text-gray-900">Select Shipping Address</h2>
                                                    </div>
                                                </div>
                                                <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-6"></div>

                                                {isLoadingAddresses ? (
                                                    <div className="text-center py-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                                        <p className="mt-4 text-gray-600">Loading addresses...</p>
                                                    </div>
                                                ) : savedAddresses.length > 0 ? (
                                                    <div className="space-y-3 mb-6">
                                                        {savedAddresses.map((address) => (
                                                            <div
                                                                key={address._id || address.id}
                                                                className={`relative p-4 border-2 rounded-lg transition-all duration-300 ${
                                                                    selectedAddressId === (address._id || address.id)
                                                                        ? 'border-amber-600 bg-amber-50'
                                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                }`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectAddress(address)}
                                                                    className="w-full text-left"
                                                                >
                                                                    <div className="flex items-start justify-between pr-16">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                {address.type === 'Home' && <Home className="w-4 h-4 text-gray-500" />}
                                                                                {address.type === 'Office' && <Building2 className="w-4 h-4 text-gray-500" />}
                                                                                {address.type === 'Other' && <MapPin className="w-4 h-4 text-gray-500" />}
                                                                                <span className="font-semibold text-gray-900">{address.type}</span>
                                                                                {address.isDefault && (
                                                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">Default</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-700 mb-1">{address.name}</p>
                                                                            <p className="text-sm text-gray-600">{address.address}</p>
                                                                            <p className="text-sm text-gray-600">{address.city}, {address.state} {address.pincode}</p>
                                                                            <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                                                                        </div>
                                                                        {selectedAddressId === (address._id || address.id) && (
                                                                            <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                                
                                                                {/* Edit and Delete buttons */}
                                                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleEditAddress(address, e)}
                                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                                                        title="Edit address"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleDeleteAddress(address._id || address.id, e)}
                                                                        disabled={isDeletingAddress === (address._id || address.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                                        title="Delete address"
                                                                    >
                                                                        {isDeletingAddress === (address._id || address.id) ? (
                                                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 mb-4">Add your first shipping address</p>
                                                )}

                                                {/* Add New Address Button */}
                                                {!showAddAddressForm && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddAddressForm(true)}
                                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-600 hover:text-amber-600 transition-all duration-300 flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        <span className="font-semibold">Add New Address</span>
                                                    </button>
                                                )}

                                                {/* Add/Edit Address Form */}
                                                {showAddAddressForm && (
                                                    <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {editingAddressId ? 'Edit Address' : 'Add New Address'}
                                                            </h3>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowAddAddressForm(false);
                                                                    setEditingAddressId(null);
                                                                    setNewAddress({
                                                                        type: 'Home',
                                                                        name: '',
                                                                        phone: formData.phone || '',
                                                                        address: '',
                                                                        city: '',
                                                                        state: '',
                                                                        pincode: '',
                                                                        country: 'India',
                                                                        isDefault: false,
                                                                    });
                                                                    setAvailableCities([]);
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address Type *</label>
                                                                <select
                                                                    value={newAddress.type}
                                                                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                    required
                                                                >
                                                                    <option value="Home">Home</option>
                                                                    <option value="Office">Office</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                            </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.firstName}
                                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.lastName}
                                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                                            <input
                                                                type="tel"
                                                                value={formData.phone || newAddress.phone}
                                                                onChange={(e) => {
                                                                    setFormData({ ...formData, phone: e.target.value });
                                                                    setNewAddress({ ...newAddress, phone: e.target.value });
                                                                }}
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                required
                                                            />
                                                        </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                                                                <input
                                                                    type="text"
                                                                    value={newAddress.address}
                                                                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={newAddress.state}
                                                                            onChange={(e) => handleStateChange(e.target.value)}
                                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 appearance-none bg-white"
                                                                            required
                                                                        >
                                                                            <option value="">Select State</option>
                                                                            {availableStates.map((state) => (
                                                                                <option key={state} value={state}>
                                                                                    {state}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={newAddress.city}
                                                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                            required
                                                                            disabled={!newAddress.state}
                                                                        >
                                                                            <option value="">
                                                                                {newAddress.state ? 'Select City' : 'Select state first'}
                                                                            </option>
                                                                            {availableCities.map((city) => (
                                                                                <option key={city} value={city}>
                                                                                    {city}
                                                                                </option>
                                                                            ))}
                                                                            {newAddress.state && availableCities.length === 0 && (
                                                                                <option value="" disabled>No cities found</option>
                                                                            )}
                                                                        </select>
                                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                                    </div>
                                                                    {/* Allow custom city input if not in list */}
                                                                    {newAddress.state && (
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Or type city name"
                                                                            value={availableCities.includes(newAddress.city) ? '' : newAddress.city}
                                                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                                            className="w-full px-4 py-2 mt-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
                                                                    <input
                                                                        type="text"
                                                                        value={newAddress.pincode}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                            setNewAddress({ ...newAddress, pincode: value });
                                                                        }}
                                                                        maxLength="6"
                                                                        pattern="[0-9]{6}"
                                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                                        placeholder="6-digit PIN"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="setDefault"
                                                                    checked={newAddress.isDefault}
                                                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                                    className="w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-amber-400"
                                                                />
                                                                <label htmlFor="setDefault" className="text-sm text-gray-700">Set as default address</label>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddNewAddress}
                                                                    disabled={isSavingAddress || !newAddress.address || !newAddress.state || !newAddress.city || !newAddress.pincode}
                                                                    className="flex-1 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    {isSavingAddress ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Save Address')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowAddAddressForm(false)}
                                                                    className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Shipping Information Form */}
                                        <div className="bg-white border border-gray-100 shadow-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <MapPin className="w-6 h-6 text-amber-600" />
                                                <h2 className="text-2xl font-light text-gray-900">Shipping Information</h2>
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-8"></div>

                                            <div className="space-y-6">
                                            {/* Contact Information */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Contact Details</h3>
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            First Name *
                                                        </label>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="firstName"
                                                                value={formData.firstName}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="John"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Last Name *
                                                        </label>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="lastName"
                                                                value={formData.lastName}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="Doe"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Email Address *
                                                        </label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="john@example.com"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                            Phone Number *
                                                            {user?.phoneVerified && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Verified
                                                                </span>
                                                            )}
                                                        </label>
                                                        <div className="relative">
                                                            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${user?.phoneVerified ? 'text-green-500' : 'text-gray-400'}`} />
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={user?.phoneVerified ? user.phone : formData.phone}
                                                                onChange={handleInputChange}
                                                                required
                                                                readOnly={user?.phoneVerified}
                                                                className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none transition-colors duration-300 ${
                                                                    user?.phoneVerified 
                                                                        ? 'border-green-200 bg-green-50 text-gray-700 cursor-not-allowed' 
                                                                        : 'border-gray-200 focus:border-gray-400'
                                                                }`}
                                                                placeholder="+91 98765 43210"
                                                            />
                                                            {user?.phoneVerified && (
                                                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                            )}
                                                        </div>
                                                        {user?.phoneVerified && (
                                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                                <Lock className="w-3 h-3" />
                                                                This verified number will be used for all orders
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="pt-6 border-t border-gray-200">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Delivery Address</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Street Address *
                                                        </label>
                                                        <div className="relative">
                                                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="123 Main Street"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Apartment, Suite, etc. (Optional)
                                                        </label>
                                                        <div className="relative">
                                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="apartment"
                                                                value={formData.apartment}
                                                                onChange={handleInputChange}
                                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="Apt 4B"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                State *
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    name="state"
                                                                    value={formData.state}
                                                                    onChange={(e) => handleFormStateChange(e.target.value)}
                                                                    required
                                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300 appearance-none bg-white"
                                                                >
                                                                    <option value="">Select State</option>
                                                                    {availableStates.map((state) => (
                                                                        <option key={state} value={state}>
                                                                            {state}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                City *
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    name="city"
                                                                    value={formData.city}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                                    required
                                                                    disabled={!formData.state}
                                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                >
                                                                    <option value="">
                                                                        {formData.state ? 'Select City' : 'Select state first'}
                                                                    </option>
                                                                    {formCities.map((city) => (
                                                                        <option key={city} value={city}>
                                                                            {city}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                            </div>
                                                            {/* Allow custom city input if not in list */}
                                                            {formData.state && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Or type city name"
                                                                    value={formCities.includes(formData.city) ? '' : (formData.city || '')}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                                    className="w-full px-4 py-2 mt-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-sm"
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                PIN Code *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="pincode"
                                                                value={formData.pincode}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                    setFormData(prev => ({ ...prev, pincode: value }));
                                                                }}
                                                                required
                                                                maxLength="6"
                                                                pattern="[0-9]{6}"
                                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors duration-300"
                                                                placeholder="6-digit PIN"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options */}
                                            {!isAuthenticated && (
                                                <div className="pt-6 border-t border-gray-200">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            name="saveInfo"
                                                            checked={formData.saveInfo}
                                                            onChange={handleInputChange}
                                                            className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-400"
                                                        />
                                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">Save this information for next time</span>
                                                    </label>
                                                </div>
                                            )}

                                            <div className="pt-6 border-t border-gray-200">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        name="newsletter"
                                                        checked={formData.newsletter}
                                                        onChange={handleInputChange}
                                                        className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-400"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Email me with news and offers</span>
                                                </label>
                                            </div>
                                        </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full mt-8 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl"
                                        >
                                            Continue to Payment
                                        </button>
                                    </div>
                                )}

                                {/* Payment Information */}
                                {step === 'payment' && (
                                    <div className="bg-white border border-gray-100 shadow-sm p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <CreditCard className="w-6 h-6 text-amber-600" />
                                            <h2 className="text-2xl font-light text-gray-900">Payment Method</h2>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-8"></div>

                                        <div className="space-y-6">
                                            {/* Payment Method Selector */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                                                    Select Payment Method
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {/* Cash on Delivery */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('COD')}
                                                        className={`p-6 border-2 rounded-lg transition-all duration-300 text-left ${
                                                            paymentMethod === 'COD'
                                                                ? 'border-amber-600 bg-amber-50'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Wallet className={`w-6 h-6 ${paymentMethod === 'COD' ? 'text-amber-600' : 'text-gray-400'}`} />
                                                            <span className={`font-semibold ${paymentMethod === 'COD' ? 'text-amber-900' : 'text-gray-900'}`}>
                                                                Cash on Delivery
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            Pay in cash when your order is delivered
                                                        </p>
                                                    </button>

                                                    {/* Online Payment */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('ONLINE')}
                                                        className={`p-6 border-2 rounded-lg transition-all duration-300 text-left ${
                                                            paymentMethod === 'ONLINE'
                                                                ? 'border-amber-600 bg-amber-50'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <CreditCard className={`w-6 h-6 ${paymentMethod === 'ONLINE' ? 'text-amber-600' : 'text-gray-400'}`} />
                                                            <span className={`font-semibold ${paymentMethod === 'ONLINE' ? 'text-amber-900' : 'text-gray-900'}`}>
                                                                Online Payment
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            Pay securely with Razorpay
                                                        </p>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* COD Message */}
                                            {paymentMethod === 'COD' && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                                    <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-900 mb-1">Cash on Delivery</p>
                                                        <p className="text-xs text-blue-700">Pay in cash when your order is delivered.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Online Payment Details */}
                                            {paymentMethod === 'ONLINE' && (
                                                <>
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                                        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-amber-900 mb-1">Secure Payment via Razorpay</p>
                                                            <p className="text-xs text-amber-700">You will be redirected to Razorpay's secure payment gateway to complete your transaction.</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full mt-8 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl"
                                        >
                                            Review Order
                                        </button>
                                    </div>
                                )}

                                {/* Review Order */}
                                {step === 'review' && (
                                    <div className="space-y-6">
                                        {/* Shipping Details */}
                                        <div className="bg-white border border-gray-100 shadow-sm p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-6 h-6 text-amber-600" />
                                                    <h2 className="text-2xl font-light text-gray-900">Shipping Details</h2>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('shipping')}
                                                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-6"></div>
                                            
                                            <div className="space-y-3 text-gray-700">
                                                <p className="font-semibold text-gray-900">{formData.firstName} {formData.lastName}</p>
                                                <p>{formData.address}</p>
                                                {formData.apartment && <p>{formData.apartment}</p>}
                                                <p>{formData.city}, {formData.state} {formData.pincode}</p>
                                                <p className="pt-3 border-t border-gray-200">{formData.email}</p>
                                                <p>{formData.phone}</p>
                                            </div>
                                        </div>

                                        {/* Payment Details */}
                                        <div className="bg-white border border-gray-100 shadow-sm p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="w-6 h-6 text-amber-600" />
                                                    <h2 className="text-2xl font-light text-gray-900">Payment Method</h2>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('payment')}
                                                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-6"></div>
                                            
                                            <div className="space-y-2 text-gray-700">
                                                {paymentMethod === 'COD' ? (
                                                    <>
                                                        <p className="font-semibold text-gray-900">Cash on Delivery</p>
                                                        <p className="text-sm text-gray-600">Pay in cash when your order is delivered</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-semibold text-gray-900">Online Payment via Razorpay</p>
                                                        <p className="text-sm text-gray-600">Secure payment gateway</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="bg-white border border-gray-100 shadow-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles className="w-6 h-6 text-amber-600" />
                                                <h2 className="text-2xl font-light text-gray-900">Order Items</h2>
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent mb-6"></div>
                                            
                                            <div className="space-y-4">
                                                {cartItems.map((item) => (
                                                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                                                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-50">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.category}</p>
                                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                                            <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-5 h-5" />
                                                    {paymentMethod === 'COD' ? 'Place Order' : 'Pay Securely'} - ₹{total.toLocaleString('en-IN')}
                                                </>
                                            )}
                                        </button>

                                        <p className="text-xs text-center text-gray-500">
                                            By placing your order, you agree to our Terms of Service and Privacy Policy
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 sticky top-32 shadow-lg">
                                {/* Title */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-5 h-5 text-amber-600" />
                                        <h2 className="text-2xl font-light text-gray-900">Order Summary</h2>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-amber-400/60 to-transparent"></div>
                                </div>

                                {/* Cart Items */}
                                <div className="space-y-4 mb-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Promo Code Section */}
                                <div className="pt-6 border-t border-gray-200 mb-6">
                                    {appliedPromoCode ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-900">{appliedPromoCode}</p>
                                                        <p className="text-xs text-green-700">Discount: ₹{discountAmount.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePromoCode}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Promo Code</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleApplyPromoCode();
                                                        }
                                                    }}
                                                    placeholder="Enter code"
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleApplyPromoCode}
                                                    disabled={isValidatingPromo || !promoCode.trim()}
                                                    className="px-4 py-2 text-sm bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isValidatingPromo ? '...' : 'Apply'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 pt-6 border-t border-gray-200 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span className="font-light">Subtotal</span>
                                        <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>

                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span className="font-light">Discount</span>
                                            <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-600">
                                        <span className="font-light">Shipping</span>
                                        <span className="font-semibold text-green-600">FREE</span>
                                    </div>


                                    {/* Total */}
                                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xl font-light text-gray-900">Total</span>
                                            <div className="text-right">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm text-gray-500">₹</span>
                                                    <span className="text-4xl font-light text-gray-900">
                                                        {total.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-3 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Shield className="w-5 h-5 text-gray-400" />
                                        <span className="font-light">100% Secure Payment</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Truck className="w-5 h-5 text-gray-400" />
                                        <span className="font-light">Free shipping on this order</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
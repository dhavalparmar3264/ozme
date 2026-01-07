import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Package, Heart, MapPin, LogOut, Settings, Star, ArrowRight, Sparkles, Crown, Gift, ShoppingBag, X, Plus, Phone, CheckCircle, Lock, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { apiRequest } from '../utils/api.js';
import toast from 'react-hot-toast';
import StateCitySelect from '../componets/StateCitySelect';

export default function LuxuryDashboard() {
  const { logout, user, checkAuth, loading: authLoading } = useAuth();
  const { wishlist, getWishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Fallback: Check for redirect path on mount (catches missed redirects)
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('post_login_redirect');
    if (redirectPath) {
      // Don't clear redirect key here - let feedback page clear it after successful submission
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [hoveredAddress, setHoveredAddress] = useState(null);
  
  // Profile form state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Phone verification state
  const [searchParams] = useSearchParams();
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  // REMOVED: phoneVerified local state - use ONLY user?.phoneVerified from auth context
  // REMOVED: showChangePhone - no longer allowing phone changes after verification

  // Fetch user data and orders on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    } else if (!authLoading && !user) {
      // If auth is done but no user, set loading to false so component can handle it
      setLoading(false);
    }
  }, [user, authLoading]);

  // Update profile form when user data loads
  useEffect(() => {
    if (user) {
      // Normalize verification status: phoneVerified is single source of truth
      const isVerified = user.phoneVerified === true || user.isPhoneVerified === true;
      
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      
      // Set phone input from user data
      setPhoneInput(user.phone || '');
      
      // CRITICAL: If user is verified, ensure OTP form is reset/hidden
      if (isVerified) {
        setShowOtpInput(false);
        setOtpInput(''); // Clear any OTP input
      }
      
      // Debug: Log verification status (temporary)
      console.log('[Dashboard] User loaded - phoneVerified:', user.phoneVerified, 'isPhoneVerified:', user.isPhoneVerified, 'isVerified:', isVerified, 'phone:', user.phone);
    } else {
      // User is null - reset form state
      setProfile({ name: '', email: '', phone: '' });
      setPhoneInput('');
      setShowOtpInput(false);
      setOtpInput('');
    }
  }, [user]);

  // Check if redirected from checkout for phone verification
  useEffect(() => {
    const tab = searchParams.get('tab');
    const verify = searchParams.get('verify');
    if (tab === 'profile' && verify === 'phone') {
      setActiveTab('profile');
      // Show a message about phone verification
      if (!user?.phoneVerified) {
        toast('Please verify your phone number to continue checkout', {
          icon: '📱',
          duration: 5000,
        });
      }
    }
  }, [searchParams, user]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timerId = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [otpTimer]);

  // Send OTP for phone verification
  const handleSendOtp = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await apiRequest('/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (response && response.success) {
        setShowOtpInput(true);
        setOtpTimer(30); // 30 seconds before resend
        toast.success('OTP sent to your phone!');
      } else {
        // Check for 409 Conflict (phone already linked)
        if (response?.errorCode === 'PHONE_ALREADY_LINKED' || response?.errorCode === 'PHONE_IN_USE') {
          throw new Error('This phone number is already linked to another account. Please use a different number.');
        }
        throw new Error(response?.message || 'Failed to send OTP');
      }
    } catch (error) {
      // Handle 409 Conflict errors with clear message
      if (error.message && error.message.includes('already linked')) {
        toast.error('This phone number is already linked to another account. Please use a different number.');
      } else {
        toast.error(error.message || 'Failed to send OTP');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await apiRequest('/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone: phoneInput.replace(/\D/g, '').slice(-10),
          otp: otpInput,
        }),
      });

      if (response && response.success) {
        // Debug: Log verification response (temporary)
        console.log('[Dashboard] OTP verify response - phoneVerified:', response.data?.phoneVerified, 'user.phoneVerified:', response.data?.user?.phoneVerified);
        
        // Extract verification data from response
        const verifiedPhone = response.data?.phone || response.data?.user?.phone;
        const isVerified = response.data?.phoneVerified === true || 
                          response.data?.isPhoneVerified === true ||
                          response.data?.user?.phoneVerified === true ||
                          response.data?.user?.isPhoneVerified === true;
        
        // OPTIMISTIC UI UPDATE: Clear OTP UI immediately
        setShowOtpInput(false);
        setOtpInput('');
        
        // Update phone input if provided
        if (verifiedPhone) {
          setProfile(prev => ({ ...prev, phone: verifiedPhone }));
          setPhoneInput(verifiedPhone);
        }
        
        toast.success('Phone number verified successfully! 🎉');
        
        // CRITICAL: Refresh auth context ONCE to get latest backend state from /api/auth/me
        // Backend is the ultimate authority - frontend should NEVER show verified unless backend returns phoneVerified=true
        const updatedUser = await checkAuth();
        
        // Debug: Log auth context after refresh (temporary)
        console.log('[Dashboard] After OTP verify checkAuth - returned user.phoneVerified:', updatedUser?.phoneVerified, 'context user.phoneVerified:', user?.phoneVerified);
        
        // Verify backend returned verified=true (safety check)
        if (updatedUser && (updatedUser.phoneVerified === true || updatedUser.isPhoneVerified === true)) {
          console.log('[Dashboard] ✅ Backend confirmed phoneVerified=true - UI will update via useEffect');
        } else {
          console.warn('[Dashboard] ⚠️ Backend did not return phoneVerified=true - UI may not update correctly');
          // Force one more checkAuth if backend didn't return verified (only once, with delay to avoid race)
          setTimeout(async () => {
            const retryUser = await checkAuth();
            console.log('[Dashboard] After retry checkAuth - user.phoneVerified:', retryUser?.phoneVerified || user?.phoneVerified);
          }, 300);
        }
        
        // NOTE: Do NOT call checkAuth() multiple times - useEffect will handle state propagation
        // This prevents infinite loops and extra re-renders
        
        // If came from checkout, redirect back
        const from = searchParams.get('from');
        if (from === 'checkout') {
          setTimeout(() => navigate('/checkout'), 1500);
        }
      } else {
        throw new Error(response?.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setIsSendingOtp(true);
    try {
      const response = await apiRequest('/phone/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneInput.replace(/\D/g, '').slice(-10) }),
      });

      if (response && response.success) {
        setOtpTimer(30);
        setOtpInput('');
        toast.success('OTP resent successfully!');
      } else {
        throw new Error(response?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      try {
        const ordersResponse = await apiRequest('/orders/user');
        if (ordersResponse && ordersResponse.success) {
          setOrders(ordersResponse.data.orders || []);
        } else {
          // Backend unavailable or no orders - use empty array
          setOrders([]);
        }
      } catch (error) {
        console.warn('Orders API unavailable, using empty array');
        setOrders([]); // Set empty array on error
      }

      // Fetch addresses
      try {
        const addressesResponse = await apiRequest('/users/me/addresses');
        if (addressesResponse && addressesResponse.success) {
          setAddresses(addressesResponse.data.addresses || []);
        } else {
          // Backend unavailable or no addresses - use empty array
          setAddresses([]);
        }
      } catch (error) {
        console.warn('Addresses API unavailable, using empty array');
        setAddresses([]); // Set empty array on error
      }
    } catch (error) {
      console.warn('Dashboard data loading error:', error);
      // Ensure we set empty arrays so component can render
      setOrders([]);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      // Don't allow changing phone if it's verified
      const updateData = {
        name: profile.name,
      };
      
      // Only include phone if it's not verified (user can't change verified phone)
      if (!user?.phoneVerified) {
        updateData.phone = profile.phone;
      }

      const response = await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response && response.success) {
        // Debug: Log response verification status
        const responseVerified = response.data?.user?.phoneVerified === true || response.data?.user?.isPhoneVerified === true;
        console.log('[Dashboard] Profile save response - phoneVerified:', response.data?.user?.phoneVerified, 'isPhoneVerified:', response.data?.user?.isPhoneVerified);
        
        toast.success('Profile updated successfully!');
        
        // CRITICAL: Refresh auth context ONCE to get latest backend state
        // This ensures UI uses backend as single source of truth
        // Only call checkAuth() once here - useEffect will handle state updates
        const updatedUser = await checkAuth();
        
        // Debug: Log auth context after refresh (temporary)
        console.log('[Dashboard] After profile save checkAuth - returned user.phoneVerified:', updatedUser?.phoneVerified, 'context user.phoneVerified:', user?.phoneVerified);
        
        // Update phone input if phone changed (from response, not from context to avoid stale state)
        if (response.data?.user?.phone) {
          setPhoneInput(response.data.user.phone);
        }
        
        // NOTE: Do NOT call checkAuth() again here - useEffect will handle state propagation
        // This prevents infinite loops and extra re-renders
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = () => {
    console.log('➕ Opening add address form');
    setEditingAddress(null);
    const nameParts = (user?.name || '').split(' ');
    setAddressForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
      isDefault: addresses.length === 0,
    });
    setShowAddressForm(true);
    console.log('✅ Address form opened');
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address._id || address.id);
    setAddressForm({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || '',
      phone: address.phone || '',
      street: address.street || address.address || '',
      apartment: address.apartment || '',
      city: address.city || '',
      state: address.state || '',
      pinCode: address.pinCode || address.pincode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 Form submit triggered');
    console.log('📋 Current form state:', addressForm);
    
    // Validate all required fields
    if (!addressForm.firstName || !addressForm.firstName.trim()) {
      toast.error('Please enter first name');
      return;
    }
    if (!addressForm.lastName || !addressForm.lastName.trim()) {
      toast.error('Please enter last name');
      return;
    }
    if (!addressForm.email || !addressForm.email.trim()) {
      toast.error('Please enter email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!addressForm.phone || !addressForm.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    if (!addressForm.street || !addressForm.street.trim()) {
      toast.error('Please enter street address');
      return;
    }
    if (!addressForm.state || !addressForm.state.trim()) {
      toast.error('Please select a state');
      return;
    }
    if (!addressForm.city || !addressForm.city.trim()) {
      toast.error('Please select a city');
      return;
    }
    if (!addressForm.pinCode || !addressForm.pinCode.trim()) {
      toast.error('Please enter PIN code');
      return;
    }
    if (!/^[0-9]{6}$/.test(addressForm.pinCode.trim())) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    
    setIsSavingAddress(true);

    // Prepare address data with trimmed values (outside try block so it's available in catch)
    const addressData = {
      firstName: addressForm.firstName.trim(),
      lastName: addressForm.lastName.trim(),
      email: addressForm.email.trim().toLowerCase(),
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      apartment: addressForm.apartment ? addressForm.apartment.trim() : '',
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pinCode: addressForm.pinCode.trim(),
      country: addressForm.country || 'India',
      isDefault: addressForm.isDefault || false,
    };

    try {
      console.log('📤 Saving address...');
      console.log('📝 Form data:', addressForm);
      console.log('📨 Sending address data:', JSON.stringify(addressData, null, 2));
      console.log('🔗 Endpoint:', editingAddress ? `PUT /users/me/addresses/${editingAddress}` : 'POST /users/me/addresses');
      // Auth token is stored in httpOnly cookie, not localStorage
      console.log('🔑 Auth: Using httpOnly cookie (not localStorage)');
      
      let response;
      if (editingAddress) {
        // Update existing address
        console.log('🔄 Updating address:', editingAddress);
        response = await apiRequest(`/users/me/addresses/${editingAddress}`, {
          method: 'PUT',
          body: JSON.stringify(addressData),
        });
      } else {
        // Add new address
        console.log('➕ Adding new address');
        response = await apiRequest('/users/me/addresses', {
          method: 'POST',
          body: JSON.stringify(addressData),
        });
      }
      
      console.log('📥 API Response received:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response is null?', response === null);
      console.log('📥 Response is undefined?', response === undefined);
      console.log('📥 Response success?', response?.success);
      
      // Handle null response (network error or backend offline)
      if (response === null || response === undefined) {
        throw new Error('No response from server. The backend may be offline or the endpoint may not exist.');
      }
      
      if (response.success) {
        toast.success(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
        
        // Reset form
        const nameParts = (user?.name || '').split(' ');
        setAddressForm({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user?.email || '',
          phone: user?.phone || '',
          street: '',
          apartment: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
          isDefault: false,
        });
        
        setShowAddressForm(false);
        setEditingAddress(null);
        
        // Reload addresses
        const addressesResponse = await apiRequest('/users/me/addresses');
        if (addressesResponse && addressesResponse.success) {
          setAddresses(addressesResponse.data.addresses || []);
          console.log('Addresses reloaded:', addressesResponse.data.addresses);
        } else {
          console.warn('Failed to reload addresses:', addressesResponse);
        }
      } else {
        // Handle non-success response
        console.error('⚠️ Response indicates failure:', response);
        if (response?.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages || response?.message || 'Validation failed');
        }
        throw new Error(response?.message || 'Failed to save address');
      }
    } catch (error) {
      console.error('❌ Address save error:', error);
      console.error('📦 Address form data sent:', addressData);
      console.error('🔍 Full error object:', JSON.stringify(error, null, 2));
      console.error('🔍 Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        stack: error.stack,
        name: error.name,
      });
      
      // Handle validation errors from API response
      let errorMessage = error.message || 'Failed to save address';
      
      // Check if error has response data (from apiRequest throw)
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('📋 Error response data:', errorData);
        
        // Handle express-validator format: { errors: [{ param, msg }] }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map(err => {
            const field = err.param || err.field || '';
            const msg = err.msg || err.message || 'Invalid value';
            return field ? `${field}: ${msg}` : msg;
          });
          errorMessage = validationErrors.join(', ');
          console.error('📋 Validation errors:', validationErrors);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      // Show error toast
      toast.error(errorMessage || 'Failed to save address. Please check the console for details.');
      
      // Don't close the form on error so user can fix and retry
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await apiRequest(`/users/me/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response && response.success) {
        toast.success('Address deleted successfully!');
        // Reload addresses
        const addressesResponse = await apiRequest('/users/me/addresses');
        if (addressesResponse && addressesResponse.success) {
          setAddresses(addressesResponse.data.addresses || []);
        }
      } else {
        throw new Error(response?.message || 'Failed to delete address');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await apiRequest(`/users/me/addresses/${addressId}/default`, {
        method: 'PATCH',
      });

      if (response && response.success) {
        toast.success('Default address updated successfully!');
        // Reload addresses
        const addressesResponse = await apiRequest('/users/me/addresses');
        if (addressesResponse && addressesResponse.success) {
          setAddresses(addressesResponse.data.addresses || []);
        }
      } else {
        throw new Error(response?.message || 'Failed to set default address');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to set default address');
    }
  };

  // Get user's first name for welcome message
  const getUserFirstName = () => {
    if (!user?.name) return 'User';
    const nameParts = user.name.split(' ');
    return nameParts[0];
  };

  // Get first letter of user's email for avatar
  const getEmailInitial = () => {
    if (user?.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If no user after auth loading, ProtectedRoute should redirect, but show message just in case
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Component will render even if orders/addresses are empty (API calls may have failed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      {/* Hero Header with Background Image */}
      <section className="relative h-[35vh] min-h-[280px] max-h-[350px] md:h-[38vh] md:min-h-[320px] md:max-h-[380px] lg:h-[40vh] lg:min-h-[350px] lg:max-h-[400px] -top-4 overflow-hidden bg-gray-900 mt-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/1200x/f1/3b/ca/f13bcad1ec222f40ad5130401068f6ed.jpg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
        </div>

        <div className="relative h-full flex items-center justify-center text-center px-4 z-10 py-4 md:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto w-full">
            {/* Tagline */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 md:mb-3 lg:mb-4">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-amber-300" />
                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-white tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] uppercase">Member Dashboard</span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl mb-2 md:mb-3 lg:mb-4 leading-[1.1] md:leading-[1.15] lg:leading-tight">
              <span className="block text-white font-light tracking-tight mt-15">
                Welcome Back,
              </span>
              <span className="block font-serif italic text-amber-300 mt-0.5 md:mt-1 lg:mt-1.5 leading-[1.1] md:leading-[1.15] lg:leading-tight">
                {user?.name || 'User'}
              </span>
            </h1>

            {/* Decorative Line */}
            <div className="flex justify-center mb-2 md:mb-3 lg:mb-4">
              <div className="h-px w-24 sm:w-28 md:w-36 lg:w-40 xl:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/80 max-w-2xl mx-auto  mb-10 leading-snug md:leading-normal lg:leading-relaxed font-light px-2">
              Manage your perfume collection and preferences
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
       

        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <div className="text-center mb-8 pb-8 border-b border-gray-100">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="text-4xl font-semibold text-white">
                      {getEmailInitial()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                </div>
                <h3 className="font-light text-xl text-gray-900 mb-1">
                  {user?.name || 'User'}
                </h3>
                <p className="text-sm text-gray-500">
                  {user?.email || ''}
                </p>
              </div>

              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowAddressForm(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-300 mt-4 border-t border-gray-100 pt-6"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h2 className="text-2xl font-light text-white">Profile Information</h2>
                    </div>
                    <p className="text-gray-400 text-sm">Update your personal details</p>
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    <div className="p-8 space-y-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                        />
                      </div>
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            Save Changes
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Phone Verification Card */}
                {(() => {
                  // SINGLE SOURCE OF TRUTH: Use ONLY user?.phoneVerified from auth context
                  // NO local state, NO cached values, NO localStorage
                  const verified = user?.phoneVerified === true || user?.isPhoneVerified === true;
                  
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className={`px-8 py-6 ${verified ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="w-5 h-5 text-white" />
                          <h2 className="text-2xl font-light text-white">Phone Verification</h2>
                          {verified && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                        <p className="text-white/80 text-sm">
                          {verified
                            ? 'Your phone number is verified and locked to your account'
                            : 'Verify your phone number to place orders'
                          }
                        </p>
                      </div>

                      <div className="p-8">
                        {verified ? (
                          /* Verified Phone Display - PERMANENT, NO CHANGE OPTION */
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                                  <Lock className="w-7 h-7 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-semibold text-gray-900">+91 {user?.phone ? `******${user.phone.slice(-4)}` : ''}</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                      ✅ Phone number verified
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    This phone number is permanently linked to your account and cannot be changed.
                                  </p>
                                  {user?.phoneVerifiedAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Verified on {new Date(user.phoneVerifiedAt).toLocaleDateString('en-IN', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                      /* Phone Verification Form */
                      <div className="space-y-6">
                        {/* Warning Banner */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Phone verification required</p>
                            <p className="text-xs text-amber-700 mt-1">
                              You must verify your phone number before placing any orders. Once verified, 
                              this number will be permanently linked to your account.
                            </p>
                          </div>
                        </div>

                        {!showOtpInput ? (
                          /* Enter Phone Number */
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mobile Number
                              </label>
                              {/* CRITICAL: Hide phone input entirely when verified (not just disabled) */}
                              {verified ? (
                                <div className="flex gap-3">
                                  <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                    +91
                                  </div>
                                  <div className="flex-1 px-4 py-3 border border-green-200 bg-green-50 rounded-lg text-gray-700">
                                    {user?.phone ? `******${user.phone.slice(-4)}` : ''}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-3">
                                  <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                    +91
                                  </div>
                                  <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => {
                                      // Only allow changes if NOT verified
                                      setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                                    }}
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                                  />
                                </div>
                              )}
                              {verified ? (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  Phone number is verified and permanently locked.
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500 mt-2">
                                  We'll send a 6-digit OTP to verify this number
                                </p>
                              )}
                            </div>
                            <button
                              onClick={handleSendOtp}
                              disabled={isSendingOtp || phoneInput.length !== 10 || verified}
                              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSendingOtp ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Sending OTP...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5" />
                                  Send OTP
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          /* Enter OTP */
                          <div className="space-y-4">
                            <div className="text-center mb-4">
                              <p className="text-gray-600">
                                OTP sent to <span className="font-semibold">+91 {phoneInput}</span>
                              </p>
                              <button
                                onClick={() => {
                                  setShowOtpInput(false);
                                  setOtpInput('');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                              >
                                Change number
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter 6-digit OTP
                              </label>
                              <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter OTP"
                                maxLength={6}
                                className="w-full px-4 py-4 text-center text-2xl font-semibold tracking-[0.5em] border border-gray-200 rounded-lg focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-300"
                              />
                            </div>

                            <button
                              onClick={handleVerifyOtp}
                              disabled={isVerifyingOtp || otpInput.length !== 6}
                              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifyingOtp ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Verify OTP
                                </>
                              )}
                            </button>

                            <div className="text-center">
                              {otpTimer > 0 ? (
                                <p className="text-sm text-gray-500">
                                  Resend OTP in <span className="font-semibold text-gray-700">{otpTimer}s</span>
                                </p>
                              ) : (
                                <button
                                  onClick={handleResendOtp}
                                  disabled={isSendingOtp}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Didn't receive OTP? Resend
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full border border-gray-100">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-900">Order History</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
                </div>

                {loading ? (
                  <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <Package className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-light text-gray-900 mb-3">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  orders.map((order) => {
                    const orderDate = new Date(order.createdAt || order.date);
                    const itemsCount = order.items?.length || 0;
                    const totalAmount = order.totalAmount || 0;
                    
                    return (
                      <div
                        key={order._id || order.id}
                        onMouseEnter={() => setHoveredOrder(order._id || order.id)}
                        onMouseLeave={() => setHoveredOrder(null)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 group"
                      >
                        <div className={`h-1 bg-gradient-to-r ${
                          order.orderStatus === 'Delivered'
                            ? 'from-green-400 to-green-500'
                            : order.orderStatus === 'Cancelled'
                            ? 'from-red-400 to-red-500'
                            : 'from-blue-400 to-blue-500'
                        } transition-all duration-500`}></div>

                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-light text-gray-900">
                                  Order #{order.orderNumber || order._id?.toString().slice(-8) || order.id}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.orderStatus === 'Delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : order.orderStatus === 'Cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {order.orderStatus || order.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Placed on {orderDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">{itemsCount} items</p>
                              <p className="text-2xl font-light text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <button
                              onClick={() => navigate(`/track-order?orderId=${order._id || order.id}`)}
                              className="px-6 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center gap-2 group-hover:gap-3"
                            >
                              View Details
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full border border-gray-100">
                    <Heart className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-semibold text-gray-900">My Wishlist ({getWishlistCount()})</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
                </div>

                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <Heart className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-light text-gray-900 mb-3">Your wishlist is empty</h3>
                    <p className="text-gray-500 mb-6">Start adding your favorite fragrances</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.map((item) => {
                      const product = item.product || item;
                      return (
                        <div
                          key={product._id || product.id}
                          className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500"
                        >
                          <div className="aspect-[4/5] overflow-hidden relative">
                            <img
                              src={product.images?.[0] || product.image || 'https://via.placeholder.com/400'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <button
                              onClick={() => navigate(`/product/${product._id || product.id}`)}
                              className="absolute bottom-4 left-4 right-4 py-3 bg-white text-gray-900 font-semibold rounded-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-2"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              Add to Cart
                            </button>
                          </div>

                          <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-light text-gray-900">{product.name}</h3>
                              {product.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-light text-gray-900">₹{product.price?.toLocaleString('en-IN') || '0'}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-200"></div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full border border-gray-100">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-900">Saved Addresses</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                </div>

                {/* Address Form Modal */}
                {showAddressForm && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-light text-gray-900">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                          // Reset form
                          const nameParts = (user?.name || '').split(' ');
                          setAddressForm({
                            firstName: nameParts[0] || '',
                            lastName: nameParts.slice(1).join(' ') || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            street: '',
                            apartment: '',
                            city: '',
                            state: '',
                            pinCode: '',
                            country: 'India',
                            isDefault: addresses.length === 0,
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        console.log('📝 Form onSubmit triggered');
                        handleSaveAddress(e);
                      }} 
                      className="space-y-4" 
                      noValidate
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                          <input
                            type="text"
                            value={addressForm.firstName}
                            onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                          <input
                            type="text"
                            value={addressForm.lastName}
                            onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={addressForm.email}
                            onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <StateCitySelect
                          state={addressForm.state}
                          city={addressForm.city}
                          onStateChange={(newState) => setAddressForm({ ...addressForm, state: newState, city: '' })}
                          onCityChange={(newCity) => setAddressForm({ ...addressForm, city: newCity })}
                          stateLabel="State *"
                          cityLabel="City *"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
                          <input
                            type="text"
                            value={addressForm.pinCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setAddressForm({ ...addressForm, pinCode: value });
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                            maxLength="6"
                            pattern="[0-9]{6}"
                            placeholder="6-digit PIN"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                        <textarea
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                          rows="3"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Apartment, Suite, etc. (Optional)</label>
                        <input
                          type="text"
                          value={addressForm.apartment}
                          onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="w-4 h-4 text-amber-400 border-gray-300 rounded focus:ring-amber-400"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          onClick={(e) => {
                            console.log('🔘 Button clicked!');
                            // Form onSubmit will handle it, but log to verify click works
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{ cursor: isSavingAddress ? 'not-allowed' : 'pointer' }}
                        >
                          {isSavingAddress ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                            // Reset form
                            const nameParts = (user?.name || '').split(' ');
                            setAddressForm({
                              firstName: nameParts[0] || '',
                              lastName: nameParts.slice(1).join(' ') || '',
                              email: user?.email || '',
                              phone: user?.phone || '',
                              street: '',
                              apartment: '',
                              city: '',
                              state: '',
                              pinCode: '',
                              country: 'India',
                              isDefault: addresses.length === 0,
                            });
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading ? (
                  <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <MapPin className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-light text-gray-900 mb-3">No addresses saved</h3>
                    <p className="text-gray-500 mb-6">Add an address for faster checkout</p>
                    <button
                      onClick={handleAddAddress}
                      className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  addresses.map((address) => {
                    const addressId = address._id || address.id;
                    const streetAddress = address.street || address.address || '';
                    const apartment = address.apartment ? `, ${address.apartment}` : '';
                    const fullAddress = `${streetAddress}${apartment}, ${address.city}, ${address.state} - ${address.pinCode || address.pincode}`;
                    const fullName = `${address.firstName || ''} ${address.lastName || ''}`.trim() || address.name || 'N/A';
                    
                    return (
                      <div
                        key={addressId}
                        onMouseEnter={() => setHoveredAddress(addressId)}
                        onMouseLeave={() => setHoveredAddress(null)}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-light text-gray-900">
                                {fullName}
                              </h3>
                              {address.isDefault && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addressId)}
                                className="px-4 py-2 border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50 transition-all duration-300 text-sm font-medium"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addressId)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-2">
                          {address.email || 'N/A'} • {address.phone}
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {fullAddress}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

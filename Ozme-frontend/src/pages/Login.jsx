import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, ArrowRight, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../utils/api';

export default function LuxuryLoginPage() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'email'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [errors, setErrors] = useState({});
  const { googleLogin, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Check sessionStorage for redirect path (set by feedback page) or use location state
  const from = sessionStorage.getItem('post_login_redirect') || location.state?.from?.pathname || '/';

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    
    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }

    // Validate phone format (10-digit Indian mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    
    if (!phoneRegex.test(cleanPhone)) {
      setErrors({ phone: 'Please enter a valid 10-digit Indian mobile number' });
      return;
    }

    setIsSendingOTP(true);
    setErrors({});

    try {
      const response = await apiRequest('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (response && response.success) {
        toast.success('OTP sent successfully!');
        setStep('otp');
        setCooldownSeconds(response.data?.cooldownSeconds || 60);
        
        // In test mode, show OTP in toast
        if (response.data?.testMode && response.data?.otp) {
          toast(`Test Mode: Your OTP is ${response.data.otp}`, { duration: 10000 });
        }
      } else {
        throw new Error(response?.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      
      if (error.response?.status === 429) {
        const waitTime = error.response?.data?.waitTime || error.response?.data?.cooldownSeconds || 60;
        setCooldownSeconds(waitTime);
        toast.error(`Please wait ${waitTime} seconds before requesting a new OTP`);
      } else {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await apiRequest('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone, otp }),
      });

      if (response && response.success) {
        // Refresh auth state
        await checkAuth();
        
        // Check if new user (needs email)
        if (response.isNewUser) {
          setStep('email');
          toast.success('OTP verified! Please provide your email');
        } else {
          // Existing user - redirect immediately
          handleRedirect();
        }
      } else {
        throw new Error(response?.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error.response?.status === 400) {
        const attemptsLeft = error.response?.data?.attemptsLeft;
        if (attemptsLeft !== undefined) {
          toast.error(`Invalid OTP. ${attemptsLeft} attempts remaining`);
        } else {
          toast.error(error.response?.data?.message || 'Invalid OTP');
        }
      } else if (error.response?.status === 423) {
        toast.error('Too many wrong attempts. Please request a new OTP');
        setStep('phone');
        setOtp('');
      } else {
        toast.error(error.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await apiRequest('/auth/profile/email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response && response.success) {
        toast.success('Email saved successfully!');
        handleRedirect();
      } else {
        throw new Error(response?.message || 'Failed to save email');
      }
    } catch (error) {
      console.error('Save email error:', error);
      
      if (error.response?.status === 409) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message || 'Failed to save email. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedirect = () => {
    // Get redirect path and clear it
    const redirectPath = sessionStorage.getItem('post_login_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('post_login_redirect');
      navigate(redirectPath, { replace: true });
    } else {
      // Use location state or default to home
      navigate(from !== '/' ? from : '/', { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleLogin();
      if (result && result.success) {
        // Check for explicit redirect path first (from feedback page)
        const redirectPath = sessionStorage.getItem('post_login_redirect');
        if (redirectPath) {
          // Don't clear redirect key here - let feedback page clear it after successful submission
          navigate(redirectPath, { replace: true });
        } else {
          // Use location state or default to home
          navigate(from !== '/' ? from : '/', { replace: true });
        }
      } else if (result && result.error) {
        toast.error(result.error || 'Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden flex items-center justify-center py-12 px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3 tracking-tight">
            Welcome
            <span className="block font-serif italic text-amber-300 mt-2">
              Back
            </span>
          </h1>
          <p className="text-gray-400 font-light">
            Sign in to continue your fragrance journey
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-none border border-white/10 p-8 shadow-2xl">
          {/* Phone Step */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(value);
                      setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                      errors.phone ? 'border-red-500' : 'border-white/10'
                    } text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-all duration-300`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSendingOTP || cooldownSeconds > 0}
                className={`w-full py-4 px-6 bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSendingOTP || cooldownSeconds > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSendingOTP ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : cooldownSeconds > 0 ? (
                  `Resend OTP in ${cooldownSeconds}s`
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1"
                >
                  ← Change phone number
                </button>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Enter OTP
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  OTP sent to {phone.replace(/(\d{2})(\d{4})(\d{4})/, '+91 $1 $2 $3')}
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setErrors({ ...errors, otp: '' });
                  }}
                  className={`w-full px-4 py-4 bg-white/5 border ${
                    errors.otp ? 'border-red-500' : 'border-white/10'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-all duration-300 text-center text-2xl tracking-widest`}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                {errors.otp && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className={`w-full py-4 px-6 bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={cooldownSeconds > 0}
                className="w-full py-3 px-6 text-gray-400 hover:text-white text-sm transition-colors"
              >
                {cooldownSeconds > 0 ? `Resend OTP in ${cooldownSeconds}s` : 'Resend OTP'}
              </button>
            </form>
          )}

          {/* Email Step (for new users) */}
          {step === 'email' && (
            <form onSubmit={handleSaveEmail} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Email Address
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Please provide your email to complete registration
                </p>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    } text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-all duration-300`}
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className={`w-full py-4 px-6 bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3 ${
              isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

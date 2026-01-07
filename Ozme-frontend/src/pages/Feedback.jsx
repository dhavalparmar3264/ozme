import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Copy, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import toast from 'react-hot-toast';
import Headers from '../componets/Headers';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const STORAGE_KEY = 'ozme_feedback_draft';
  const REDIRECT_KEY = 'post_login_redirect';

  // Initialize form state - check sessionStorage first
  const getInitialFormData = () => {
    const savedDraft = sessionStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return {
          longevity: parsed.longevity || '',
          projection: parsed.projection || '',
          fragrance_satisfaction: parsed.fragrance_satisfaction || '',
          packaging: parsed.packaging || '',
          delivery: parsed.delivery || '',
          recommend: parsed.recommend || '',
          order_ref: parsed.order_ref || '',
          note: parsed.note || '',
          honeypot: '', // Anti-spam honeypot field (never restore)
        };
      } catch (e) {
        console.error('Failed to restore feedback draft:', e);
      }
    }
    return {
      longevity: '',
      projection: '',
      fragrance_satisfaction: '',
      packaging: '',
      delivery: '',
      recommend: '',
      order_ref: '',
      note: '',
      honeypot: '', // Anti-spam honeypot field
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if required fields are filled
  const isFormValid = formData.longevity && formData.fragrance_satisfaction && formData.packaging;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Save draft to sessionStorage (exclude honeypot)
      const draft = { ...updated };
      delete draft.honeypot;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please answer all required questions');
      return;
    }

    // Check authentication - if not logged in, save state and redirect to login
    if (!isAuthenticated) {
      // Save draft to sessionStorage
      const draft = { ...formData };
      delete draft.honeypot;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      
      // Save redirect path to sessionStorage (for Google login flow)
      // Use 'post_login_redirect' as the key (single source of truth)
      sessionStorage.setItem('post_login_redirect', '/feedback');
      
      // Redirect to login with return path
      navigate('/login', { state: { from: { pathname: '/feedback' } } });
      toast.info('Please login to submit feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response && response.success) {
        // Clear saved draft and redirect path on success
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem('post_login_redirect');
        
        setIsSuccess(true);
        setCouponCode(response.couponCode || 'OZME10');
        toast.success('Thank you for your feedback!');
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // MCQ Option Component
  const MCQOption = ({ value, label, name, checked, onChange, required = false }) => (
    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
      checked 
        ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        required={required}
        className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500 focus:ring-2"
      />
      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </label>
  );

  // MCQ Section Component
  const MCQSection = ({ title, name, options, required = false }) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
        {title} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <MCQOption
            key={option.value}
            value={option.value}
            label={option.label}
            name={name}
            checked={formData[name] === option.value}
            onChange={(e) => handleChange(name, e.target.value)}
            required={required}
          />
        ))}
      </div>
    </div>
  );

  // Scroll to top on success
  useEffect(() => {
    if (isSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Headers />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white mb-4">
              Thank you for your feedback!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              Your input helps us improve your OZME experience.
            </p>

            {/* Coupon Code Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-8 mb-8 shadow-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Your 10% OFF code:
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <code className="text-3xl sm:text-4xl font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                  {couponCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use it on your next order.
              </p>
            </div>

            {/* Back to Shop Button */}
            <button
              onClick={() => window.location.href = '/shop'}
              className="inline-flex items-center px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-900 dark:hover:bg-gray-100 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Headers />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12 sm:pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-white mb-3">
            Feedback
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help us improve your OZME experience.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={(e) => handleChange('honeypot', e.target.value)}
            className="hidden"
            tabIndex="-1"
            autoComplete="off"
          />

          {/* Longevity - Required */}
          <MCQSection
            title="How long did it last?"
            name="longevity"
            options={[
              { value: '2-4 hours', label: '2–4 hours' },
              { value: '4-6 hours', label: '4–6 hours' },
              { value: '6-8 hours', label: '6–8 hours' },
              { value: '8+ hours', label: '8+ hours' },
            ]}
            required
          />

          {/* Projection - Optional */}
          <MCQSection
            title="How strong was it?"
            name="projection"
            options={[
              { value: 'Soft / close to skin', label: 'Soft / close to skin' },
              { value: 'Moderate', label: 'Moderate' },
              { value: 'Strong', label: 'Strong' },
            ]}
          />

          {/* Fragrance Satisfaction - Required */}
          <MCQSection
            title="Fragrance satisfaction"
            name="fragrance_satisfaction"
            options={[
              { value: 'Loved it', label: 'Loved it' },
              { value: 'Good', label: 'Good' },
              { value: 'Okay', label: 'Okay' },
              { value: 'Not for me', label: 'Not for me' },
            ]}
            required
          />

          {/* Packaging - Required */}
          <MCQSection
            title="Packaging experience"
            name="packaging"
            options={[
              { value: 'Excellent', label: 'Excellent' },
              { value: 'Good', label: 'Good' },
              { value: 'Average', label: 'Average' },
              { value: 'Poor', label: 'Poor' },
            ]}
            required
          />

          {/* Delivery - Optional */}
          <MCQSection
            title="Delivery experience"
            name="delivery"
            options={[
              { value: 'On time', label: 'On time' },
              { value: 'Slightly delayed', label: 'Slightly delayed' },
              { value: 'Delayed', label: 'Delayed' },
            ]}
          />

          {/* Recommend - Optional */}
          <MCQSection
            title="Would you recommend OZME?"
            name="recommend"
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'Maybe', label: 'Maybe' },
              { value: 'No', label: 'No' },
            ]}
          />

          {/* Optional Fields */}
          <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Order Reference */}
            <div>
              <label htmlFor="order_ref" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Order ID / Phone / Email <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="order_ref"
                value={formData.order_ref}
                onChange={(e) => handleChange('order_ref', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Optional"
              />
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Additional comments <span className="text-gray-500 font-normal">(Optional, max 200 characters)</span>
              </label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    handleChange('note', e.target.value);
                  }
                }}
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Share any additional thoughts..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                {formData.note.length}/200
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;


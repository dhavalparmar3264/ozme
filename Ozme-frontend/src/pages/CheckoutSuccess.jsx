import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your payment...');
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        const processPaymentSuccess = async () => {
            try {
                // Step 1: Get order_id from URL query params (Cashfree uses order_id)
                // Also check for orderId (alternative format)
                let orderIdFromUrl = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('id');
                
                // Step 2: Validate MongoDB ObjectId format (24 hex characters)
                const isValidMongoObjectId = (id) => {
                    if (!id || typeof id !== 'string') return false;
                    // MongoDB ObjectId is exactly 24 hexadecimal characters
                    return /^[0-9a-fA-F]{24}$/.test(id);
                };

                // Step 3: If missing or invalid, try to get from localStorage (fallback)
                if (!orderIdFromUrl || !isValidMongoObjectId(orderIdFromUrl)) {
                    if (orderIdFromUrl && !isValidMongoObjectId(orderIdFromUrl)) {
                        console.warn('⚠️ Invalid order_id format (not MongoDB ObjectId):', orderIdFromUrl);
                    } else {
                        console.log('⚠️ No order_id in URL, checking localStorage...');
                    }
                    
                    const lastOrderId = localStorage.getItem('lastOrderId');
                    if (lastOrderId && isValidMongoObjectId(lastOrderId)) {
                        orderIdFromUrl = lastOrderId;
                        console.log('✅ Found valid order_id in localStorage:', lastOrderId);
                    } else {
                        orderIdFromUrl = null;
                    }
                }

                // Step 4: If still no valid order_id, redirect to track-order immediately
                if (!orderIdFromUrl || !isValidMongoObjectId(orderIdFromUrl)) {
                    console.log('❌ No valid order_id found, redirecting to track-order');
                    setStatus('error');
                    setMessage('Order ID not found. Redirecting to track order...');
                    // Redirect immediately
                    setTimeout(() => {
                        navigate('/track-order', { replace: true });
                    }, 1500);
                    return;
                }

                setOrderId(orderIdFromUrl);
                console.log('✅ Order ID found:', orderIdFromUrl);

                // Save order_id to localStorage for future fallback
                localStorage.setItem('lastOrderId', orderIdFromUrl);

                // Step 4: Verify payment status BEFORE showing success
                // This ensures we confirm payment with Cashfree before redirecting
                setStatus('verifying');
                setMessage('Verifying payment status...');
                
                try {
                    // Get order to check payment status
                    const orderResponse = await apiRequest(`/orders/${orderIdFromUrl}`);
                    const order = orderResponse?.data?.order;
                    
                    if (order) {
                        // Check payment status from order
                        console.log('🔍 Verifying payment status:', {
                            orderId: orderIdFromUrl,
                            paymentStatus: order.paymentStatus,
                            orderStatus: order.orderStatus,
                        });
                        
                        // If payment failed, show error
                        if (order.paymentStatus === 'Failed') {
                            setStatus('error');
                            setMessage('Payment failed. Please try again.');
                            setTimeout(() => {
                                navigate('/track-order', { replace: true });
                            }, 3000);
                            return;
                        }
                        
                        // If payment is pending, verify with Cashfree status API
                        if (order.paymentStatus === 'Pending') {
                            try {
                                const statusResponse = await apiRequest(`/payments/cashfree/status/${orderIdFromUrl}`);
                                if (statusResponse && statusResponse.success) {
                                    console.log('✅ Payment status verified:', {
                                        paymentStatus: statusResponse.data?.paymentStatus,
                                        orderStatus: statusResponse.data?.orderStatus,
                                    });
                                    
                                    if (statusResponse.data?.paymentStatus === 'Failed') {
                                        setStatus('error');
                                        setMessage('Payment failed. Please try again.');
                                        setTimeout(() => {
                                            navigate('/track-order', { replace: true });
                                        }, 3000);
                                        return;
                                    }
                                }
                            } catch (statusError) {
                                // Non-critical - webhook will update status
                                console.warn('⚠️ Payment status check error (non-critical):', statusError);
                            }
                        }
                        
                        // Clear cart ONLY after payment is confirmed (Paid status)
                        if (order.paymentStatus === 'Paid' || order.orderStatus === 'Processing') {
                            try {
                                clearCart();
                                localStorage.removeItem('cart');
                                localStorage.removeItem('cartItems');
                                localStorage.removeItem('guestCart');
                                // Clear buyNowItem if it exists
                                sessionStorage.removeItem('buyNowItem');
                                localStorage.removeItem('buyNowItem');
                                console.log('✅ Cart and buyNowItem cleared after successful payment confirmation');
                            } catch (cartError) {
                                console.warn('⚠️ Error clearing cart:', cartError);
                            }
                        }
                    }
                } catch (verifyError) {
                    // Non-critical - payment might be processed via webhook
                    console.warn('⚠️ Payment verification error (non-critical):', verifyError);
                }
                
                // Step 5: Show success and redirect
                setStatus('success');
                setMessage('Payment successful! Redirecting to order details...');

                // Step 5: Redirect to track-order page with orderId (TrackOrder expects orderId parameter)
                // Redirect immediately after validation (no delay needed)
                console.log('✅ Redirecting to track-order with orderId:', orderIdFromUrl);
                navigate(`/track-order?orderId=${orderIdFromUrl}`, { replace: true });

            } catch (error) {
                console.error('❌ Error processing payment success:', error);
                setStatus('error');
                setMessage('An error occurred. Redirecting to track order...');
                setTimeout(() => {
                    navigate('/track-order');
                }, 2000);
            }
        };

        processPaymentSuccess();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verifying Payment
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {message}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-amber-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {message}
                        </p>
                        {orderId && (
                            <p className="text-sm text-gray-500 mb-4">
                                Order ID: {orderId}
                            </p>
                        )}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="w-16 h-16 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing...
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {message}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full animate-pulse" style={{ width: '40%' }}></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


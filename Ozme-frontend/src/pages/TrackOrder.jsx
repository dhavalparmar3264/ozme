import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Package, MapPin, FileText, X, Download, Search, Eye, Calendar, Clock, Truck, XCircle, CreditCard, Wallet, ArrowLeft, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../utils/api';
import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';

export default function TrackOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identifier } = useParams();
  const [orders, setOrders] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  
  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [paymentStartTime, setPaymentStartTime] = useState(null);
  const paymentPollIntervalRef = useRef(null);

  // Load all orders on mount
  useEffect(() => {
    const loadAllOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all orders from backend (same as Dashboard)
        const response = await apiRequest('/orders/user');
        
        if (response && response.success) {
          // Get orders array (handle both response.data.orders and response.data)
          const ordersArray = (response.data?.orders || response.data || []);
          
          // Ensure it's an array
          const validOrdersArray = Array.isArray(ordersArray) ? ordersArray : [];
          
          // Transform backend orders to frontend format
          const transformedOrders = validOrdersArray.map(order => {
            const deliveryStatus = order.deliveryStatus || order.orderStatus || 'Pending';
            // If payment is successful and status is Processing, show as Confirmed
            const displayStatus = ((order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') && deliveryStatus === 'Processing') 
              ? 'Confirmed' 
              : deliveryStatus;
            
            return {
            orderId: order._id,
            backendOrderId: order._id,
            orderNumber: order.orderNumber || `OZME-${order._id.toString().slice(-8).toUpperCase()}`,
            orderDate: order.createdAt,
            status: displayStatus,
            deliveryStatus: deliveryStatus,
            trackingNumber: order.trackingNumber,
            courierName: order.courierName,
            shippedAt: order.shippedAt,
            outForDeliveryAt: order.outForDeliveryAt,
            deliveredAt: order.deliveredAt,
            items: order.items?.map(item => ({
              id: item.product?._id || item.product,
              name: item.product?.name || 'Product',
              image: item.product?.images?.[0] || item.product?.image || '',
              price: item.price,
              quantity: item.quantity,
              size: item.size || '120ml',
              category: item.product?.category || 'Perfume',
            })) || [],
            shippingAddress: order.shippingAddress ? {
              firstName: order.shippingAddress.name?.split(' ')[0] || '',
              lastName: order.shippingAddress.name?.split(' ').slice(1).join(' ') || '',
              email: order.user?.email || '',
              phone: order.shippingAddress.phone || '',
              address: order.shippingAddress.address || '',
              city: order.shippingAddress.city || '',
              state: order.shippingAddress.state || '',
              pincode: order.shippingAddress.pincode || '',
            } : {},
            paymentMethod: order.paymentMethod === 'Prepaid' ? 'ONLINE' : 'COD',
            paymentStatus: order.paymentStatus,
            paymentMethodType: order.paymentMethodType || null,
            subtotal: order.subtotal || (order.totalAmount + (order.discountAmount || 0)),
            shippingCost: order.shippingCost || 0,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount || 0,
            promoCode: order.promoCode,
          };
          });
          
          setOrders(transformedOrders);
          
          // Save to localStorage as backup (or clear if empty)
          if (validOrdersArray.length === 0) {
            // Clear localStorage if backend returns no orders
            localStorage.removeItem('allOrders');
          } else {
            localStorage.setItem('allOrders', JSON.stringify(transformedOrders));
          }
          
          // Check if we need to show a specific order
          // Priority: orderId (MongoDB ObjectId) > order_id > id > other
          const urlParams = new URLSearchParams(location.search);
          const orderIdentifier = identifier || 
                                  urlParams.get('orderId') || // Primary: MongoDB ObjectId from CheckoutSuccess
                                  urlParams.get('order_id') || // Cashfree redirect uses order_id
                                  urlParams.get('id') ||
                                  location.state?.orderId || 
                                  location.state?.trackingNumber;
          
          // Validate MongoDB ObjectId format (24 hex characters)
          const isValidMongoObjectId = (id) => {
            if (!id || typeof id !== 'string') return false;
            return /^[0-9a-fA-F]{24}$/.test(id);
          };
          
          // Ensure we're in list mode if no identifier
          if (!orderIdentifier) {
            setViewMode('list');
            setOrderData(null);
          } else if (orderIdentifier) {
            // Prioritize MongoDB ObjectId matching (backendOrderId or orderId)
            // This ensures Cashfree redirects with MongoDB _id work correctly
            const foundOrder = transformedOrders.find(o => {
              // Exact match on MongoDB ObjectId (most reliable)
              if (isValidMongoObjectId(orderIdentifier)) {
                return o.backendOrderId === orderIdentifier || o.orderId === orderIdentifier;
              }
              // Fallback to other identifiers
              return o.orderId === orderIdentifier || 
                     o.backendOrderId === orderIdentifier ||
                     o.trackingNumber === orderIdentifier ||
                     o.orderNumber === orderIdentifier;
            });
            
            if (foundOrder) {
              // Auto-open order details when orderId is in URL (from payment redirect)
              setOrderData(foundOrder);
              setViewMode('detail');
              console.log('✅ Auto-opened order from URL:', orderIdentifier);
            } else {
              // Try to fetch from backend if not in list
              try {
                const orderResponse = await apiRequest(`/orders/track/${orderIdentifier}`);
                if (orderResponse && orderResponse.success && orderResponse.data.order) {
                  const backendOrder = orderResponse.data.order;
                  const deliveryStatus = backendOrder.deliveryStatus || backendOrder.orderStatus || 'Pending';
                  // If payment is successful and status is Processing, show as Confirmed
                  const displayStatus = ((backendOrder.paymentStatus === 'SUCCESS' || backendOrder.paymentStatus === 'Paid') && deliveryStatus === 'Processing') 
                    ? 'Confirmed' 
                    : deliveryStatus;
                  
                  const transformedOrder = {
                    orderId: backendOrder._id,
                    backendOrderId: backendOrder._id,
                    orderNumber: backendOrder.orderNumber || `OZME-${backendOrder._id.toString().slice(-8).toUpperCase()}`,
                    orderDate: backendOrder.createdAt,
                    status: displayStatus,
                    deliveryStatus: deliveryStatus,
                    trackingNumber: backendOrder.trackingNumber,
                    courierName: backendOrder.courierName,
                    shippedAt: backendOrder.shippedAt,
                    outForDeliveryAt: backendOrder.outForDeliveryAt,
                    deliveredAt: backendOrder.deliveredAt,
                    items: backendOrder.items?.map(item => ({
                      id: item.product?._id || item.product,
                      name: item.product?.name || 'Product',
                      image: item.product?.images?.[0] || item.product?.image || '',
                      price: item.price,
                      quantity: item.quantity,
                      size: item.size || '120ml',
                      category: item.product?.category || 'Perfume',
                    })) || [],
                    shippingAddress: {
                      firstName: backendOrder.shippingAddress?.name?.split(' ')[0] || '',
                      lastName: backendOrder.shippingAddress?.name?.split(' ').slice(1).join(' ') || '',
                      email: backendOrder.user?.email || '',
                      phone: backendOrder.shippingAddress?.phone || '',
                      address: backendOrder.shippingAddress?.address || '',
                      city: backendOrder.shippingAddress?.city || '',
                      state: backendOrder.shippingAddress?.state || '',
                      pincode: backendOrder.shippingAddress?.pincode || '',
                    },
                    paymentMethod: backendOrder.paymentMethod === 'Prepaid' ? 'ONLINE' : 'COD',
                    paymentStatus: backendOrder.paymentStatus,
                    paymentMethodType: backendOrder.paymentMethodType || null,
                    subtotal: backendOrder.subtotal || (backendOrder.totalAmount + (backendOrder.discountAmount || 0)),
                    shippingCost: backendOrder.shippingCost || 0,
                    totalAmount: backendOrder.totalAmount,
                    discountAmount: backendOrder.discountAmount || 0,
                    promoCode: backendOrder.promoCode,
                  };
                  setOrderData(transformedOrder);
                  setViewMode('detail');
                }
              } catch (err) {
                console.error('Error fetching order:', err);
                setError('Order not found');
              }
            }
          }
        } else {
        // Backend unavailable or no orders, clear localStorage and show empty
        localStorage.removeItem('allOrders');
        setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        // Error occurred, clear localStorage and show empty
        localStorage.removeItem('allOrders');
        setError('Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, [location.pathname, location.search, location.state, identifier]);

  // Payment status polling effect - aligned with backend throttle (30s)
  useEffect(() => {
    if (!orderData || orderData.paymentMethod !== 'ONLINE') return;

    const orderId = orderData.backendOrderId || orderData.orderId;
    if (!orderId) return;

    const fetchPaymentStatus = async (orderId) => {
      try {
        const response = await apiRequest(`/orders/${orderId}/payment-status`);
        if (response && response.success) {
          const status = response.data;
          setPaymentStatus(status);

          // Stop polling if payment is confirmed or failed
          if (status.paymentStatus === 'SUCCESS' || status.paymentStatus === 'FAILED') {
            if (paymentPollIntervalRef.current) {
              clearInterval(paymentPollIntervalRef.current);
              paymentPollIntervalRef.current = null;
            }
            setPaymentPolling(false);
            
            // Refresh order data if payment succeeded (without page reload)
            if (status.paymentStatus === 'SUCCESS') {
              // Fetch updated order data without reloading the page
              const currentOrderId = orderData.backendOrderId || orderData.orderId;
              if (currentOrderId) {
                try {
                  const orderResponse = await apiRequest(`/orders/track/${currentOrderId}`);
                  if (orderResponse && orderResponse.success && orderResponse.data.order) {
                    const backendOrder = orderResponse.data.order;
                    const deliveryStatus = backendOrder.deliveryStatus || backendOrder.orderStatus || 'Pending';
                    // If payment is successful and status is Processing, show as Confirmed
                    const displayStatus = (backendOrder.paymentStatus === 'SUCCESS' && deliveryStatus === 'Processing') 
                      ? 'Confirmed' 
                      : deliveryStatus;
                    
                    const transformedOrder = {
                      orderId: backendOrder._id,
                      backendOrderId: backendOrder._id,
                      orderNumber: backendOrder.orderNumber || `OZME-${backendOrder._id.toString().slice(-8).toUpperCase()}`,
                      orderDate: backendOrder.createdAt,
                      status: displayStatus,
                      deliveryStatus: deliveryStatus,
                      trackingNumber: backendOrder.trackingNumber,
                      courierName: backendOrder.courierName,
                      shippedAt: backendOrder.shippedAt,
                      outForDeliveryAt: backendOrder.outForDeliveryAt,
                      deliveredAt: backendOrder.deliveredAt,
                      items: backendOrder.items?.map(item => ({
                        id: item.product?._id || item.product,
                        name: item.product?.name || 'Product',
                        image: item.product?.images?.[0] || item.product?.image || '',
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size || '120ml',
                        category: item.product?.category || 'Perfume',
                      })) || [],
                      shippingAddress: {
                        firstName: backendOrder.shippingAddress?.name?.split(' ')[0] || '',
                        lastName: backendOrder.shippingAddress?.name?.split(' ').slice(1).join(' ') || '',
                        email: backendOrder.user?.email || '',
                        phone: backendOrder.shippingAddress?.phone || '',
                        address: backendOrder.shippingAddress?.address || '',
                        city: backendOrder.shippingAddress?.city || '',
                        state: backendOrder.shippingAddress?.state || '',
                        pincode: backendOrder.shippingAddress?.pincode || '',
                      },
                      paymentMethod: backendOrder.paymentMethod === 'Prepaid' ? 'ONLINE' : 'COD',
                      paymentStatus: backendOrder.paymentStatus,
                      paymentMethodType: backendOrder.paymentMethodType || null,
                      subtotal: backendOrder.subtotal || (backendOrder.totalAmount + (backendOrder.discountAmount || 0)),
                      shippingCost: backendOrder.shippingCost || 0,
                      totalAmount: backendOrder.totalAmount,
                      discountAmount: backendOrder.discountAmount || 0,
                      promoCode: backendOrder.promoCode,
                    };
                    setOrderData(transformedOrder);
                  }
                } catch (err) {
                  console.error('Error refreshing order data:', err);
                }
              }
            }
          } else if (status.paymentStatus === 'PENDING' && status.remainingMinutes === null) {
            // Backend says payment timed out (>20 min), stop polling
            if (paymentPollIntervalRef.current) {
              clearInterval(paymentPollIntervalRef.current);
              paymentPollIntervalRef.current = null;
            }
            setPaymentPolling(false);
          }
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
      }
    };

    const scheduleNextPoll = (nextCheckAt) => {
      if (paymentPollIntervalRef.current) {
        clearInterval(paymentPollIntervalRef.current);
        paymentPollIntervalRef.current = null;
      }

      if (!nextCheckAt) {
        // No nextCheckAt provided, use default 30s interval (aligned with backend throttle)
        paymentPollIntervalRef.current = setInterval(() => {
          fetchPaymentStatus(orderId);
        }, 30000); // 30 seconds - aligned with backend throttle
        return;
      }

      const nextCheckTime = new Date(nextCheckAt).getTime();
      const now = Date.now();
      const delay = Math.max(0, nextCheckTime - now);

      // Schedule next poll at backend's recommended time
      paymentPollIntervalRef.current = setTimeout(() => {
        fetchPaymentStatus(orderId);
        // After first poll, continue with 30s interval
        paymentPollIntervalRef.current = setInterval(() => {
          fetchPaymentStatus(orderId);
        }, 30000);
      }, delay);
    };

    const startPaymentPolling = async () => {
      if (!paymentStartTime) {
        setPaymentStartTime(Date.now());
      }
      setPaymentPolling(true);

      // Initial fetch
      await fetchPaymentStatus(orderId);

      // Get nextCheckAt from response and schedule accordingly
      const response = await apiRequest(`/orders/${orderId}/payment-status`);
      if (response && response.success && response.data.nextCheckAt) {
        scheduleNextPoll(response.data.nextCheckAt);
      } else {
        // Fallback: use 30s interval
        scheduleNextPoll(null);
      }
    };

    startPaymentPolling();

    // Cleanup on unmount
    return () => {
      if (paymentPollIntervalRef.current) {
        clearInterval(paymentPollIntervalRef.current);
        clearTimeout(paymentPollIntervalRef.current);
        paymentPollIntervalRef.current = null;
      }
    };
  }, [orderData?.backendOrderId, orderData?.orderId, orderData?.paymentMethod]);

  // Fetch payment status handler
  const handleRefreshPaymentStatus = async () => {
    const orderId = orderData?.backendOrderId || orderData?.orderId;
    if (!orderId) return;

    try {
      const response = await apiRequest(`/orders/${orderId}/payment-status`);
      if (response && response.success) {
        setPaymentStatus(response.data);
        toast.success('Payment status refreshed');
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      toast.error('Failed to refresh payment status');
    }
  };

  // Retry payment handler
  const handleRetryPayment = async () => {
    const orderId = orderData?.backendOrderId || orderData?.orderId;
    if (!orderId) return;

    try {
      toast.loading('Creating new payment session...', { id: 'retry-payment' });
      
      // Use new retry payment endpoint
      const response = await apiRequest(`/orders/${orderId}/retry-payment`, {
        method: 'POST',
      });

      if (response && response.success && response.data.paymentSessionId) {
        toast.success('Payment session created. Redirecting to payment...', { id: 'retry-payment' });
        
        // Open Cashfree checkout using payment link or session ID
        if (response.data.paymentLink) {
          // If payment link is provided, redirect directly
          window.location.href = response.data.paymentLink;
        } else if (response.data.paymentSessionId) {
          // Use Cashfree SDK if available
          if (window.Cashfree) {
            const cashfree = window.Cashfree({ mode: 'production' });
            cashfree.checkout({
              paymentSessionId: response.data.paymentSessionId,
              redirectTarget: '_self',
            });
          } else {
            // Load Cashfree SDK if not available
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.async = true;
            script.onload = () => {
              const cashfree = window.Cashfree({ mode: 'production' });
              cashfree.checkout({
                paymentSessionId: response.data.paymentSessionId,
                redirectTarget: '_self',
              });
            };
            document.head.appendChild(script);
          }
        } else {
          toast.error('No payment link available. Please contact support.', { id: 'retry-payment' });
        }
      } else {
        toast.error(response?.message || 'Failed to create payment session. Please try again.', { id: 'retry-payment' });
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error(error.message || 'Failed to retry payment. Please try again.', { id: 'retry-payment' });
    }
  };

  // Filter orders by search term (tracking number, order ID, order number)
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.trackingNumber?.toLowerCase().includes(search) ||
      order.orderId?.toLowerCase().includes(search) ||
      order.orderNumber?.toLowerCase().includes(search) ||
      order.backendOrderId?.toLowerCase().includes(search)
    );
  });

  // Handle view order
  const handleViewOrder = (order) => {
    setOrderData(order);
    setViewMode('detail');
    // Update URL without navigation
    window.history.pushState({}, '', `/track-order?orderId=${order.backendOrderId || order.orderId}`);
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list');
    setOrderData(null);
    setSearchTerm('');
    window.history.pushState({}, '', '/track-order');
  };

  // Open review modal for a delivered order
  const openReviewModal = (order) => {
    setReviewOrder(order);
    // Initialize review data for each product in the order
    const initialReviewData = {};
    order.items?.forEach(item => {
      initialReviewData[item.id] = {
        rating: 0,
        comment: '',
        productName: item.name,
        productImage: item.image,
      };
    });
    setReviewData(initialReviewData);
    setReviewSuccess(null);
    setReviewError(null);
    setShowReviewModal(true);
  };

  // Close review modal
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewOrder(null);
    setReviewData({});
    setReviewSuccess(null);
    setReviewError(null);
  };

  // Handle star rating click
  const handleRatingClick = (productId, rating) => {
    setReviewData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
      }
    }));
  };

  // Handle comment change
  const handleCommentChange = (productId, comment) => {
    setReviewData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment,
      }
    }));
  };

  // Submit reviews
  const handleSubmitReviews = async () => {
    // Check if at least one product has a rating
    const productsWithRating = Object.entries(reviewData).filter(([, data]) => data.rating > 0);
    
    if (productsWithRating.length === 0) {
      setReviewError('Please rate at least one product');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    
    let successCount = 0;
    let errorMessages = [];

    for (const [productId, data] of productsWithRating) {
      try {
        const response = await apiRequest('/reviews', {
          method: 'POST',
          body: JSON.stringify({
            productId,
            rating: data.rating,
            comment: data.comment || '',
          }),
        });

        if (response?.success) {
          successCount++;
        } else {
          errorMessages.push(`${data.productName}: ${response?.message || 'Failed to submit'}`);
        }
      } catch (err) {
        errorMessages.push(`${data.productName}: ${err.message || 'Failed to submit'}`);
      }
    }

    setSubmittingReview(false);

    if (successCount > 0) {
      setReviewSuccess(`Successfully submitted ${successCount} review${successCount > 1 ? 's' : ''}! Thank you for your feedback.`);
      // Close modal after 2 seconds on success
      setTimeout(() => {
        closeReviewModal();
      }, 2500);
    }

    if (errorMessages.length > 0) {
      setReviewError(errorMessages.join('\n'));
    }
  };

  // Format order date
  const formatOrderDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'shipped':
      case 'out for delivery':
        return {
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: <Truck className="w-4 h-4" />,
        };
      case 'processing':
        return {
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          icon: <Clock className="w-4 h-4" />,
        };
      case 'confirmed':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'cancelled':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <Clock className="w-4 h-4" />,
        };
    }
  };

  // Calculate delivery date
  const getDeliveryDate = () => {
    if (!orderData?.orderDate) return 'Thursday';
    const orderDate = new Date(orderData.orderDate);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[deliveryDate.getDay()];
  };

  // Get status progress based on deliveryStatus
  const getStatusProgress = () => {
    const status = orderData?.deliveryStatus || orderData?.status || 'Pending';
    return {
      ordered: status === 'Pending' || status === 'Processing' || status === 'Shipped' || status === 'Out for Delivery' || status === 'Delivered',
      shipped: status === 'Shipped' || status === 'Out for Delivery' || status === 'Delivered',
      outForDelivery: status === 'Out for Delivery' || status === 'Delivered',
      delivered: status === 'Delivered',
    };
  };

  // Handle Invoice Download (only allowed for DELIVERED orders - server-side gated)
  const handleInvoiceDownload = async () => {
    if (!orderData) return;
    
    // Frontend check (UX) - server will also enforce
    const isDelivered = orderData.deliveryStatus === 'Delivered' || orderData.status === 'Delivered';
    if (!isDelivered) {
      toast.error('Invoice is only available after your order is delivered.');
      return;
    }

    // Try to fetch from backend endpoint (server-side gated)
    const orderId = orderData.backendOrderId || orderData.orderId;
    try {
      const response = await apiRequest(`/orders/${orderId}/invoice`);
      if (response && response.success) {
        // Backend confirmed order is delivered, proceed with client-side PDF generation
        // (Server-side PDF generation can be added later)
      } else {
        toast.error(response?.message || 'Failed to generate invoice. Please try again.');
        return;
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Invoice is only available after your order is delivered.');
        return;
      }
      console.error('Error fetching invoice:', error);
      // Continue with client-side generation if backend endpoint fails
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('OZME PERFUMES', margin, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', pageWidth - margin, 25, { align: 'right' });
    
    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Order ID: ${orderData.orderId}`, margin, yPosition, pageWidth - 2 * margin, 10);
    yPosition = addText(`Order Date: ${formatOrderDate(orderData.orderDate)}`, margin, yPosition, pageWidth - 2 * margin, 10);
    yPosition = addText(`Payment Method: ${orderData.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}`, margin, yPosition, pageWidth - 2 * margin, 10);
    if (orderData.promoCode) {
      yPosition = addText(`Promo Code: ${orderData.promoCode}`, margin, yPosition, pageWidth - 2 * margin, 10);
    }
    yPosition += 5;

    if (orderData.shippingAddress) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const customerName = `${orderData.shippingAddress.firstName || ''} ${orderData.shippingAddress.lastName || ''}`.trim();
      if (customerName) {
        yPosition = addText(`Name: ${customerName}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      if (orderData.shippingAddress.email) {
        yPosition = addText(`Email: ${orderData.shippingAddress.email}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      if (orderData.shippingAddress.phone) {
        yPosition = addText(`Phone: ${orderData.shippingAddress.phone}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      yPosition += 3;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Shipping Address:', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addressLines = [];
      if (orderData.shippingAddress.address) {
        addressLines.push(orderData.shippingAddress.address);
      }
      if (orderData.shippingAddress.apartment) {
        addressLines.push(orderData.shippingAddress.apartment);
      }
      const cityState = [
        orderData.shippingAddress.city,
        orderData.shippingAddress.state,
        orderData.shippingAddress.pincode
      ].filter(Boolean).join(', ');
      if (cityState) {
        addressLines.push(cityState);
      }

      addressLines.forEach(line => {
        yPosition = addText(line, margin, yPosition, pageWidth - 2 * margin, 10);
      });
      yPosition += 5;
    }

    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Items', margin, yPosition);
    yPosition += 10;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Product', margin + 2, yPosition);
    doc.text('Qty', pageWidth - 100, yPosition);
    doc.text('Price', pageWidth - 60, yPosition);
    doc.text('Total', pageWidth - margin - 20, yPosition, { align: 'right' });
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    let calculatedSubtotal = 0;
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const itemName = item.name || 'Product';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const itemTotal = price * quantity;
        calculatedSubtotal += itemTotal;

        const nameLines = doc.splitTextToSize(itemName, pageWidth - 140);
        doc.setFontSize(9);
        doc.text(nameLines, margin + 2, yPosition);
        doc.text(quantity.toString(), pageWidth - 100, yPosition);
        doc.text(`₹${price.toLocaleString('en-IN')}`, pageWidth - 60, yPosition);
        doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
        yPosition += Math.max(nameLines.length * 4, 8);
        
        if (index < orderData.items.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 3;
        }
      });
    }

    yPosition += 5;

    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtotal = orderData.subtotal || calculatedSubtotal;
    const shipping = orderData.shippingCost || 0;
    const discountAmount = orderData.discountAmount || 0;
    const grandTotal = orderData.totalAmount || (subtotal - discountAmount + shipping);

    doc.text('Subtotal:', pageWidth - 80, yPosition, { align: 'right' });
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
    yPosition += 6;

    if (discountAmount > 0) {
      doc.setTextColor(0, 150, 0); // Green color for discount
      const discountLabel = orderData.promoCode ? `Discount (${orderData.promoCode}):` : 'Discount:';
      doc.text(discountLabel, pageWidth - 80, yPosition, { align: 'right' });
      doc.text(`-₹${discountAmount.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 6;
    }

    if (shipping > 0 || orderData.shippingCost !== undefined) {
      doc.text('Shipping:', pageWidth - 80, yPosition, { align: 'right' });
      doc.text(shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
      yPosition += 6;
    }

    yPosition += 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - 80, yPosition, { align: 'right' });
    doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
    yPosition += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your purchase!', margin, pageHeight - 15);
    doc.text('Inclusive of all taxes', pageWidth - margin - 2, pageHeight - 15, { align: 'right' });

    const fileName = `invoice-${orderData.orderId}.pdf`;
    doc.save(fileName);
  };

  // LIST VIEW
  if (viewMode === 'list') {
    const progress = orderData ? getStatusProgress() : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-amber-600" />
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">Your Orders</h1>
            </div>
            <p className="text-gray-600">View and track all your orders</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, order number, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-16 sm:py-24">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400 animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Loading Orders...</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Please wait while we fetch your orders from the server.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 sm:py-24">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Orders Found' : 'No Orders Yet'}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? 'No orders match your search. Try a different tracking number or order ID.'
                  : 'You haven\'t placed any orders yet. Start shopping to see your orders here.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/shop')}
                  className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl"
                >
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => handleViewOrder(order)}
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                            <p className="text-lg font-semibold text-gray-900">{order.orderNumber || order.orderId}</p>
                          </div>
                          {order.trackingNumber && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
                              <p className="text-sm font-semibold text-gray-900">{order.trackingNumber}</p>
                            </div>
                          )}
                          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${statusInfo.color}`}>
                            {statusInfo.icon}
                            <span className="text-xs font-semibold capitalize">{order.status || 'Pending'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatOrderDate(order.orderDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            {order.paymentMethod === 'COD' ? (
                              <Wallet className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <CreditCard className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span>
                              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Amount & Action Buttons */}
                      <div className="flex flex-col sm:items-end gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString('en-IN') || '0'}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Write Review Button - Only for Delivered Orders */}
                          {order.status === 'Delivered' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(order);
                              }}
                              className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                            >
                              <Star className="w-4 h-4" />
                              Write Review
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </p>
                        <div className="space-y-4">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                  {item.category || 'Perfume'}
                                </p>
                                <h4 className="text-base font-semibold text-gray-900 mb-2 break-words">{item.name}</h4>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
                                  <span>Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span></span>
                                  {item.size && (
                                    <span>Size: <span className="font-semibold text-gray-900">{item.size}</span></span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-500 mb-1">Price</p>
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                  ₹{item.price?.toLocaleString('en-IN') || '0'}
                                </p>
                                <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                                <p className="text-base font-semibold text-gray-900">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-500 text-center pt-2">
                              + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Modal for List View */}
        {showReviewModal && reviewOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={closeReviewModal}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={closeReviewModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Write a Review</h2>
                  <p className="text-gray-600 mt-1">Share your experience with these products</p>
                  <p className="text-sm text-gray-500 mt-2">Order: {reviewOrder.orderNumber || reviewOrder.orderId}</p>
                </div>

                {/* Success Message */}
                {reviewSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">{reviewSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {reviewError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-2 text-red-700">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm whitespace-pre-line">{reviewError}</span>
                    </div>
                  </div>
                )}

                {/* Products to Review */}
                {!reviewSuccess && (
                  <div className="space-y-6">
                    {reviewOrder.items?.map((item, index) => (
                      <div key={item.id || index} className="border border-gray-200 rounded-xl p-4">
                        {/* Product Info */}
                        <div className="flex gap-4 mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.size}</p>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Rating
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingClick(item.id, star)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= (reviewData[item.id]?.rating || 0)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Review (Optional)
                          </label>
                          <textarea
                            value={reviewData[item.id]?.comment || ''}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            placeholder="Share your thoughts about this product..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={closeReviewModal}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitReviews}
                        disabled={submittingReview}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Star className="w-5 h-5" />
                            Submit Review
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Close Button After Success */}
                {reviewSuccess && (
                  <button
                    onClick={closeReviewModal}
                    className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 rounded-xl"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAIL VIEW
  if (!orderData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Order Found</h2>
          <p className="text-gray-600 mb-6">No order data available.</p>
          <button
            onClick={handleBackToList}
            className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all rounded-xl"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const progress = getStatusProgress();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-25">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold">Back to Orders</span>
        </button>

        {/* Payment Confirmation Banner */}
        {orderData.paymentMethod === 'ONLINE' && (
          <PaymentConfirmationBanner 
            orderId={orderData.backendOrderId || orderData.orderId}
            paymentStatus={paymentStatus}
            paymentPolling={paymentPolling}
            paymentStartTime={paymentStartTime}
            onRetryPayment={handleRetryPayment}
            onRefreshStatus={handleRefreshPaymentStatus}
          />
        )}

        {/* Top Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-2">
              Arriving {getDeliveryDate()}
            </h1>
            <p className="text-sm text-gray-500">Order ID: {orderData.orderNumber || orderData.orderId}</p>
            {(orderData.courierName || orderData.trackingNumber) && (
              <p className="text-sm text-gray-500">
                {orderData.courierName && orderData.trackingNumber 
                  ? `${orderData.courierName} ${orderData.trackingNumber}`
                  : orderData.trackingNumber 
                    ? `Tracking Number: ${orderData.trackingNumber}`
                    : orderData.courierName
                      ? `Courier: ${orderData.courierName}`
                      : ''}
              </p>
            )}
          </div>
          
          {orderData.items && orderData.items.length > 0 && (
            <div className="flex gap-2 sm:gap-4">
              {orderData.items.slice(0, 2).map((item, index) => (
                <div key={index} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
              <div
                className={`h-full transition-all duration-500 ${
                  progress.delivered
                    ? 'bg-blue-600 w-full'
                    : progress.outForDelivery
                    ? 'bg-blue-600 w-3/4'
                    : progress.shipped
                    ? 'bg-blue-600 w-1/2'
                    : progress.ordered
                    ? 'bg-blue-600 w-1/4'
                    : 'bg-gray-200 w-0'
                }`}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    progress.ordered
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {progress.ordered ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    progress.ordered ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  Ordered
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    progress.shipped
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {progress.shipped ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    progress.shipped ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  Shipped
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    progress.outForDelivery
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {progress.outForDelivery ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium text-center ${
                    progress.outForDelivery ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  Out for delivery
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    progress.delivered
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {progress.delivered ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    progress.delivered ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  Delivered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Shipping Address</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">
                {orderData.shippingAddress?.firstName} {orderData.shippingAddress?.lastName}
              </p>
              {orderData.shippingAddress?.address && (
                <p>{orderData.shippingAddress.address}</p>
              )}
              {orderData.shippingAddress?.apartment && (
                <p>{orderData.shippingAddress.apartment}</p>
              )}
              {orderData.shippingAddress?.city && (
                <p>
                  {orderData.shippingAddress.city}
                  {orderData.shippingAddress.state && `, ${orderData.shippingAddress.state}`}
                  {orderData.shippingAddress.pincode && ` ${orderData.shippingAddress.pincode}`}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Order Info</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Product Status:</span> {orderData.status || orderData.deliveryStatus || 'Pending'}
              </div>
              {(orderData.courierName || orderData.trackingNumber) && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tracking:</span>{' '}
                  {orderData.courierName && orderData.trackingNumber 
                    ? `${orderData.courierName} ${orderData.trackingNumber}`
                    : orderData.trackingNumber || orderData.courierName}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Payment:</span> {
                  orderData.paymentMethod === 'COD' 
                    ? 'Cash on Delivery' 
                    : (orderData.paymentMethodType || 'Online Payment')
                }
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            {(orderData.deliveryStatus === 'Delivered' || orderData.status === 'Delivered') ? (
              <button
                onClick={handleInvoiceDownload}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-all duration-300 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 text-sm font-semibold cursor-not-allowed rounded-lg"
                title="Invoice available after delivery"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {orderData.items?.map((item, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                    {item.category || 'Perfume'}
                  </p>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">{item.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Quantity: {item.quantity}</span>
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">₹{orderData.subtotal?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-green-600">
                  {orderData.shippingCost === 0 ? 'FREE' : `₹${orderData.shippingCost?.toLocaleString('en-IN')}`}
                </span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount {orderData.promoCode && `(${orderData.promoCode})`}</span>
                  <span className="font-medium text-green-600">
                    -₹{orderData.discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <div className="text-right">
                <span className="text-2xl font-semibold text-gray-900">
                  ₹{orderData.totalAmount?.toLocaleString('en-IN') || '0'}
                </span>
                <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-gray-900">
                  {orderData.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium text-gray-900">{formatOrderDate(orderData.orderDate)}</span>
              </div>
            </div>
            
            {/* Write Review Button for Detail View - Only for Delivered Orders */}
            {orderData.status === 'Delivered' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openReviewModal(orderData)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                >
                  <Star className="w-5 h-5" />
                  Write a Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeReviewModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={closeReviewModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Write a Review</h2>
                <p className="text-gray-600 mt-1">Share your experience with these products</p>
                <p className="text-sm text-gray-500 mt-2">Order: {reviewOrder.orderNumber || reviewOrder.orderId}</p>
              </div>

              {/* Success Message */}
              {reviewSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{reviewSuccess}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {reviewError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2 text-red-700">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm whitespace-pre-line">{reviewError}</span>
                  </div>
                </div>
              )}

              {/* Products to Review */}
              {!reviewSuccess && (
                <div className="space-y-6">
                  {reviewOrder.items?.map((item, index) => (
                    <div key={item.id || index} className="border border-gray-200 rounded-xl p-4">
                      {/* Product Info */}
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.size}</p>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingClick(item.id, star)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (reviewData[item.id]?.rating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review (Optional)
                        </label>
                        <textarea
                          value={reviewData[item.id]?.comment || ''}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          placeholder="Share your thoughts about this product..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={closeReviewModal}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReviews}
                      disabled={submittingReview}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Star className="w-5 h-5" />
                          Submit Review
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Close Button After Success */}
              {reviewSuccess && (
                <button
                  onClick={closeReviewModal}
                  className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 rounded-xl"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Payment Confirmation Banner Component
function PaymentConfirmationBanner({ orderId, paymentStatus, paymentPolling, paymentStartTime, onRetryPayment, onRefreshStatus }) {
  if (!paymentStatus) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Checking payment status...</span>
        </div>
      </div>
    );
  }

  if (paymentStatus.paymentStatus === 'SUCCESS') {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">✅ Payment Successful - Order Confirmed</span>
        </div>
      </div>
    );
  }

  if (paymentStatus.paymentStatus === 'FAILED') {
    const failureMessage = paymentStatus.failureReason === 'TIMEOUT_PENDING_OVER_20_MIN'
      ? 'Payment confirmation timed out after 20 minutes. Please retry payment.'
      : paymentStatus.failureReason === 'EXPIRED'
      ? 'Payment session expired. Please retry payment.'
      : paymentStatus.failureReason === 'CANCELLED'
      ? 'Payment was cancelled. Please retry payment.'
      : 'Your payment could not be processed. Please try again.';

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-700 mb-2">❌ Payment Failed</div>
            <p className="text-sm text-red-600 mb-3">
              {failureMessage}
            </p>
            {paymentStatus.canRetryPayment && (
              <button
                onClick={onRetryPayment}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry Payment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PENDING status - use backend's remainingMinutes if available, otherwise calculate from start time
  const remainingMinutes = paymentStatus.remainingMinutes !== null && paymentStatus.remainingMinutes !== undefined
    ? paymentStatus.remainingMinutes
    : (paymentStartTime ? Math.max(0, Math.ceil((20 * 60 * 1000 - (Date.now() - paymentStartTime)) / 60000)) : 20);
  
  const isTimeout = remainingMinutes === 0 || paymentStatus.timeElapsedMinutes >= 20;

  return (
    <div className={`mb-6 p-4 border rounded-lg ${isTimeout ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        {paymentPolling ? (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="font-medium text-blue-700 mb-2">
            ⏳ Payment pending confirmation
          </div>
          {isTimeout ? (
            <>
              <p className="text-sm text-amber-700 mb-3">
                Payment confirmation is taking longer than expected. This can take up to 20 minutes. If payment was already deducted, your order will auto-confirm once we receive confirmation.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onRefreshStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
                {paymentStatus.canRetryPayment && (
                  <button
                    onClick={onRetryPayment}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-600 mb-2">
                This can take up to 20 minutes. Checking again... ({remainingMinutes} {remainingMinutes === 1 ? 'minute' : 'minutes'} remaining)
              </p>
              <button
                onClick={onRefreshStatus}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Refresh now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

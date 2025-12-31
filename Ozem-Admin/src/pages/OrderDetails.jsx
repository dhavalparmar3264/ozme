import { ArrowLeft, Check, Clock, Package, Truck, MapPin, CreditCard, User, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

// Simple notification helper (temporary - replace with react-hot-toast after installing)
const notify = {
  success: (message) => {
    console.log('✅ Success:', message);
    // You can replace this with react-hot-toast after installation
  },
  error: (message) => {
    console.error('❌ Error:', message);
    alert(message); // Temporary fallback
  }
};

const OrderDetails = ({ onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('Blue Dart');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch order from backend
  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/admin/orders/${id}`);
      
      if (response && response.success) {
        const backendOrder = response.data.order;
        
        // Transform backend order to frontend format
        const transformedOrder = {
          _id: backendOrder._id,
          id: `OZME-${backendOrder._id.toString().slice(-8).toUpperCase()}`,
          orderNumber: backendOrder.orderNumber || `OZME-${backendOrder._id.toString().slice(-8).toUpperCase()}`,
          customer: backendOrder.user?.name || 'Guest',
          email: backendOrder.user?.email || backendOrder.shippingAddress?.email || '',
          phone: backendOrder.shippingAddress?.phone || '',
          amount: backendOrder.totalAmount || 0,
          paymentMethod: backendOrder.paymentMethod === 'Prepaid' ? 'Online' : 'COD',
          status: backendOrder.orderStatus || 'Pending',
          deliveryStatus: backendOrder.deliveryStatus || backendOrder.orderStatus || 'Pending',
          paymentStatus: backendOrder.paymentStatus || 'Pending',
          date: backendOrder.createdAt || new Date().toISOString(),
          items: backendOrder.items?.map(item => ({
            name: item.product?.name || 'Product',
            qty: item.quantity || 1,
            price: item.price || 0,
            size: item.size || '100ml',
            image: item.product?.images?.[0] || ''
          })) || [],
          subtotal: backendOrder.subtotal || (backendOrder.totalAmount + (backendOrder.discountAmount || 0)),
          shipping: backendOrder.shippingCost || 0,
          discount: backendOrder.discountAmount || 0,
          shippingAddress: backendOrder.shippingAddress ? 
            `${backendOrder.shippingAddress.address || ''}, ${backendOrder.shippingAddress.apartment || ''}, ${backendOrder.shippingAddress.city || ''}, ${backendOrder.shippingAddress.state || ''} ${backendOrder.shippingAddress.pincode || ''}`.trim().replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') :
            '',
          trackingNumber: backendOrder.trackingNumber || '',
          courierName: backendOrder.courierName || '',
          timeline: generateTimeline(backendOrder),
          promoCode: backendOrder.promoCode,
          backendOrder: backendOrder,
        };
        
        setOrder(transformedOrder);
        setTrackingNumber(backendOrder.trackingNumber || '');
        setCourierName(backendOrder.courierName || 'Blue Dart');
      } else {
        setError('Failed to fetch order');
        notify.error(response?.message || 'Failed to load order');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order');
      notify.error(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // Generate timeline from deliveryStatus (preferred) or orderStatus
  const generateTimeline = (backendOrder) => {
    const timeline = [];
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStatus = backendOrder.deliveryStatus || backendOrder.orderStatus || 'Pending';
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    statusOrder.forEach((status, index) => {
      const isCompleted = index <= currentIndex && currentStatus !== 'Cancelled';
      let statusDate = null;
      
      // Use specific timestamps if available
      if (status === 'Shipped' && backendOrder.shippedAt) {
        statusDate = backendOrder.shippedAt;
      } else if (status === 'Out for Delivery' && backendOrder.outForDeliveryAt) {
        statusDate = backendOrder.outForDeliveryAt;
      } else if (status === 'Delivered' && backendOrder.deliveredAt) {
        statusDate = backendOrder.deliveredAt;
      } else if (isCompleted) {
        statusDate = backendOrder.updatedAt || backendOrder.createdAt;
      }
      
      timeline.push({
        status: status,
        date: statusDate,
        completed: isCompleted,
      });
    });
    
    if (currentStatus === 'Cancelled') {
      timeline.push({
        status: 'Cancelled',
        date: backendOrder.updatedAt || backendOrder.createdAt,
        completed: true,
      });
    }
    
    return timeline;
  };

  const handleUpdateStatus = async (newStatus, tracking = null, courier = null) => {
    if (!order) return;
    
    try {
      setUpdatingStatus(true);
      
      const updateData = {
        deliveryStatus: newStatus, // Use deliveryStatus as primary field
        orderStatus: newStatus, // Keep orderStatus for backward compatibility
      };
      
      if (tracking !== null) {
        updateData.trackingNumber = tracking || trackingNumber || '';
      }
      
      if (courier !== null) {
        updateData.courierName = courier || courierName || 'Blue Dart';
      }
      
      const response = await apiRequest(`/admin/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      if (response && response.success) {
        notify.success('Order status updated successfully!');
        fetchOrder(); // Refresh order data
      } else {
        notify.error(response?.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      notify.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Shipped': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      'Processing': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Canceled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    };
    
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onBack ? onBack() : navigate('/orders')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-blue-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Orders</span>
          </button>
          <div>
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-1 tracking-tight">
              Order <span className="font-serif italic text-amber-600">Details</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-light">Order ID: {order.id}</p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-blue-100/20 dark:border-amber-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Order <span className="font-serif italic">Items</span>
              </h2>
            </div>

            <div className="p-6 space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-gray-700/30 dark:to-transparent rounded-xl border border-amber-100/20 dark:border-blue-900/20">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Quantity: {item.qty}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    ₹{(item.price * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}

              <div className="mt-6 pt-6 border-t border-blue-100/20 dark:border-blue-900/20 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-800 dark:text-white font-semibold">₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-800 dark:text-white font-semibold">
                    {order.shipping === 0 ? 'Free' : `₹${order.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount {order.promoCode && `(${order.promoCode})`}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">-₹{order.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-blue-100/20 dark:border-blue-900/20">
                  <span className="text-gray-800 dark:text-white">Total</span>
                  <span className="text-amber-600 dark:text-blue-400">₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Order <span className="font-serif italic text-amber-600">Timeline</span>
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {order.timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    event.completed 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {event.completed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`text-sm font-semibold ${
                      event.completed ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {event.status}
                    </p>
                    {event.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(event.date).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Note */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Add <span className="font-serif italic">Note</span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                rows="4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add internal notes for this order..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none"
              />

              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold">
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Customer <span className="font-serif italic">Info</span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.customer}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Shipping <span className="font-serif italic">Address</span>
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{order.shippingAddress}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Payment <span className="font-serif italic">Info</span>
              </h2>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Method</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                  order.paymentStatus === 'Paid' || order.paymentStatus === 'Success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                    : order.paymentStatus === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Update <span className="font-serif italic">Status</span>
              </h2>
            </div>

            <div className="p-6 space-y-3">
              {order.status !== 'Processing' && order.status !== 'Cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('Processing')}
                  disabled={updatingStatus}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Processing'}
                </button>
              )}
              {order.status === 'Processing' && order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <>
                  <div className="mb-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Courier Name
                      </label>
                      <select
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      >
                        <option value="Blue Dart">Blue Dart</option>
                        <option value="DTDC">DTDC</option>
                        <option value="FedEx">FedEx</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="India Post">India Post</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateStatus('Shipped', trackingNumber, courierName)}
                    disabled={updatingStatus || !trackingNumber.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? 'Updating...' : 'Mark as Shipped'}
                  </button>
                </>
              )}
              {order.status === 'Shipped' && order.status !== 'Out for Delivery' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('Out for Delivery')}
                  disabled={updatingStatus}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Out for Delivery'}
                </button>
              )}
              {(order.status === 'Shipped' || order.status === 'Out for Delivery') && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('Delivered')}
                  disabled={updatingStatus}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
                </button>
              )}
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      handleUpdateStatus('Cancelled');
                    }
                  }}
                  disabled={updatingStatus}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              {(order.trackingNumber || order.courierName) && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl space-y-2">
                  {order.courierName && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Courier</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.courierName}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tracking Number</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
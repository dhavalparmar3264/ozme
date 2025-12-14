import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Package, MapPin, FileText, X, Download, Search, Eye, Calendar, Clock, Truck, XCircle, CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../utils/api';
import jsPDF from 'jspdf';

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
          const transformedOrders = validOrdersArray.map(order => ({
            orderId: order._id,
            backendOrderId: order._id,
            orderNumber: order.orderNumber || `OZME-${order._id.toString().slice(-8).toUpperCase()}`,
            orderDate: order.createdAt,
            status: order.orderStatus || 'Pending',
            trackingNumber: order.trackingNumber,
            items: order.items?.map(item => ({
              id: item.product?._id || item.product,
              name: item.product?.name || 'Product',
              image: item.product?.images?.[0] || item.product?.image || '',
              price: item.price,
              quantity: item.quantity,
              size: item.size || '100ml',
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
            subtotal: order.totalAmount + (order.discountAmount || 0),
            shippingCost: 0,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount || 0,
          }));
          
          setOrders(transformedOrders);
          
          // Also save to localStorage as backup
          localStorage.setItem('allOrders', JSON.stringify(transformedOrders));
          
          // Check if we need to show a specific order
          const urlParams = new URLSearchParams(location.search);
          const orderIdentifier = identifier || 
                                  urlParams.get('orderId') || 
                                  urlParams.get('id') ||
                                  location.state?.orderId || 
                                  location.state?.trackingNumber;
          
          // Ensure we're in list mode if no identifier
          if (!orderIdentifier) {
            setViewMode('list');
            setOrderData(null);
          } else if (orderIdentifier) {
            const foundOrder = transformedOrders.find(o => 
              o.orderId === orderIdentifier || 
              o.backendOrderId === orderIdentifier ||
              o.trackingNumber === orderIdentifier ||
              o.orderNumber === orderIdentifier
            );
            
            if (foundOrder) {
              setOrderData(foundOrder);
              setViewMode('detail');
            } else {
              // Try to fetch from backend if not in list
              try {
                const orderResponse = await apiRequest(`/orders/track/${orderIdentifier}`);
                if (orderResponse && orderResponse.success && orderResponse.data.order) {
                  const backendOrder = orderResponse.data.order;
                  const transformedOrder = {
                    orderId: backendOrder._id,
                    backendOrderId: backendOrder._id,
                    orderNumber: backendOrder.orderNumber || `OZME-${backendOrder._id.toString().slice(-8).toUpperCase()}`,
                    orderDate: backendOrder.createdAt,
                    status: backendOrder.orderStatus,
                    trackingNumber: backendOrder.trackingNumber,
                    items: backendOrder.items?.map(item => ({
                      id: item.product?._id || item.product,
                      name: item.product?.name || 'Product',
                      image: item.product?.images?.[0] || item.product?.image || '',
                      price: item.price,
                      quantity: item.quantity,
                      size: item.size || '100ml',
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
                    subtotal: backendOrder.totalAmount + (backendOrder.discountAmount || 0),
                    shippingCost: 0,
                    totalAmount: backendOrder.totalAmount,
                    discountAmount: backendOrder.discountAmount || 0,
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
          // Backend unavailable or no orders, try localStorage
          try {
            const localOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
            setOrders(localOrders);
          } catch (localError) {
            console.error('Error loading orders from localStorage:', localError);
            setOrders([]);
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        // Fallback to localStorage
        try {
          const localOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
          setOrders(localOrders);
        } catch (localError) {
          console.error('Error loading orders from localStorage:', localError);
          setError('Failed to load orders');
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, [location.pathname, location.search, location.state, identifier]);

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

  // Get status progress
  const getStatusProgress = () => {
    const status = orderData?.status || 'Processing';
    return {
      ordered: status === 'Processing' || status === 'Shipped' || status === 'Delivered',
      shipped: status === 'Shipped' || status === 'Delivered',
      outForDelivery: status === 'Out for Delivery' || status === 'Delivered',
      delivered: status === 'Delivered',
    };
  };

  // Handle Invoice Download
  const handleInvoiceDownload = () => {
    if (!orderData) return;

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
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">My Orders</h1>
            </div>
            <p className="text-gray-600">View and track all your orders</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by tracking number, order ID, or order number..."
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

                      {/* Total Amount & Action Button */}
                      <div className="flex flex-col sm:items-end gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString('en-IN') || '0'}
                          </p>
                        </div>
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

        {/* Top Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-2">
              Arriving {getDeliveryDate()}
            </h1>
            <p className="text-sm text-gray-500">Order ID: {orderData.orderNumber || orderData.orderId}</p>
            {orderData.trackingNumber && (
              <p className="text-sm text-gray-500">Tracking Number: {orderData.trackingNumber}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Delivery Info</h3>
            <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Update delivery instructions</span>
            </div>
          </div>

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
                <span className="font-medium">Status:</span> {orderData.status}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Payment:</span> {orderData.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            <button
              onClick={handleInvoiceDownload}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-all duration-300 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
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
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-gray-500">₹</span>
                  <span className="text-2xl font-semibold text-gray-900">
                    {orderData.totalAmount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

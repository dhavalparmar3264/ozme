import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ArrowLeft, Eye, Calendar, CheckCircle2, Clock, Truck, XCircle, CreditCard, Wallet, Download } from 'lucide-react';
import { apiRequest } from '../utils/api';
import jsPDF from 'jspdf';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from backend first
        const response = await apiRequest('/orders/user');
        
        if (response && response.success && response.data.orders) {
          // Transform backend orders to frontend format
          const transformedOrders = response.data.orders.map(order => ({
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
        } else {
          // Backend unavailable, try localStorage
          const localOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
          setOrders(localOrders);
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
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

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

  // Handle view order
  const handleViewOrder = (orderId) => {
    // Find the order in current orders state
    const order = orders.find(o => o.orderId === orderId || o.backendOrderId === orderId);
    
    if (order) {
      // Set as current order and navigate
      localStorage.setItem('currentOrder', JSON.stringify(order));
      navigate('/track-order', { state: { orderId: order.backendOrderId || order.orderId, timestamp: Date.now() } });
    } else {
      // Fallback: try localStorage
      const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
      const localOrder = allOrders.find(o => o.orderId === orderId || o.backendOrderId === orderId);
      if (localOrder) {
        localStorage.setItem('currentOrder', JSON.stringify(localOrder));
        navigate('/track-order', { state: { orderId: localOrder.backendOrderId || localOrder.orderId, timestamp: Date.now() } });
      }
    }
  };

  // Format order date for invoice
  const formatOrderDateForInvoice = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle Invoice Download
  const handleInvoiceDownload = (order) => {
    if (!order) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Header
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

    // Order Information
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Order ID: ${order.orderId}`, margin, yPosition, pageWidth - 2 * margin, 10);
    yPosition = addText(`Order Date: ${formatOrderDateForInvoice(order.orderDate)}`, margin, yPosition, pageWidth - 2 * margin, 10);
    yPosition = addText(`Payment Method: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}`, margin, yPosition, pageWidth - 2 * margin, 10);
    if (order.promoCode) {
      yPosition = addText(`Promo Code: ${order.promoCode}`, margin, yPosition, pageWidth - 2 * margin, 10);
    }
    yPosition += 5;

    // Customer Information
    if (order.shippingAddress) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const customerName = `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
      if (customerName) {
        yPosition = addText(`Name: ${customerName}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      if (order.shippingAddress.email) {
        yPosition = addText(`Email: ${order.shippingAddress.email}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      if (order.shippingAddress.phone) {
        yPosition = addText(`Phone: ${order.shippingAddress.phone}`, margin, yPosition, pageWidth - 2 * margin, 10);
      }
      yPosition += 3;

      // Shipping Address
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Shipping Address:', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addressLines = [];
      if (order.shippingAddress.address) {
        addressLines.push(order.shippingAddress.address);
      }
      if (order.shippingAddress.apartment) {
        addressLines.push(order.shippingAddress.apartment);
      }
      const cityState = [
        order.shippingAddress.city,
        order.shippingAddress.state,
        order.shippingAddress.pincode
      ].filter(Boolean).join(', ');
      if (cityState) {
        addressLines.push(cityState);
      }

      addressLines.forEach(line => {
        yPosition = addText(line, margin, yPosition, pageWidth - 2 * margin, 10);
      });
      yPosition += 5;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    // Order Items
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Items', margin, yPosition);
    yPosition += 10;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Product', margin + 2, yPosition);
    doc.text('Qty', pageWidth - 100, yPosition);
    doc.text('Price', pageWidth - 60, yPosition);
    doc.text('Total', pageWidth - margin - 20, yPosition, { align: 'right' });
    yPosition += 8;

    // Order Items - Calculate subtotal from items
    doc.setFont('helvetica', 'normal');
    let calculatedSubtotal = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const itemName = item.name || 'Product';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const itemTotal = price * quantity;
        calculatedSubtotal += itemTotal;

        // Product name (with wrapping)
        const nameLines = doc.splitTextToSize(itemName, pageWidth - 140);
        doc.setFontSize(9);
        doc.text(nameLines, margin + 2, yPosition);
        
        // Quantity, Price, Total
        doc.text(quantity.toString(), pageWidth - 100, yPosition);
        doc.text(`₹${price.toLocaleString('en-IN')}`, pageWidth - 60, yPosition);
        doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
        
        yPosition += Math.max(nameLines.length * 4, 8);
        
        // Add a line between items
        if (index < order.items.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 3;
        }
      });
    }

    yPosition += 5;

    // Check if we need a new page for summary
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Order Summary
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtotal = order.subtotal || calculatedSubtotal;
    const shipping = order.shippingCost || 0;
    const discountAmount = order.discountAmount || 0;
    const grandTotal = order.totalAmount || (subtotal - discountAmount + shipping);

    doc.text('Subtotal:', pageWidth - 80, yPosition, { align: 'right' });
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
    yPosition += 6;

    if (discountAmount > 0) {
      doc.setTextColor(0, 150, 0); // Green color for discount
      const discountLabel = order.promoCode ? `Discount (${order.promoCode}):` : 'Discount:';
      doc.text(discountLabel, pageWidth - 80, yPosition, { align: 'right' });
      doc.text(`-₹${discountAmount.toLocaleString('en-IN')}`, pageWidth - margin - 2, yPosition, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 6;
    }

    if (shipping > 0 || order.shippingCost !== undefined) {
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

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your purchase!', margin, pageHeight - 15);
    doc.text('Inclusive of all taxes', pageWidth - margin - 2, pageHeight - 15, { align: 'right' });

    // Save the PDF
    const fileName = `invoice-${order.orderId}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">My Orders</h1>
          </div>
          <p className="text-gray-600">View and track all your orders</p>
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
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div
                  key={order.orderId}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                          <p className="text-lg font-semibold text-gray-900">{order.orderId}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="text-xs font-semibold capitalize">{order.status || ''}</span>
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
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleViewOrder(order.orderId)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        {order.status === 'Delivered' && (
                          <button
                            onClick={() => handleInvoiceDownload(order)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                          >
                            <Download className="w-4 h-4" />
                            Download Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Full Product Details */}
                  {order.items && order.items.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </p>
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            {/* Product Image */}
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

                            {/* Product Details */}
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

                            {/* Price and Subtotal */}
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


import { Eye, Search, Filter, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Orders = ({ onViewOrder }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      
      const queryString = params.toString();
      const endpoint = `/admin/orders${queryString ? '?' + queryString : ''}`;
      
      const response = await apiRequest(endpoint);
      
      if (response && response.success) {
        // Transform backend orders to match frontend format
        const transformedOrders = response.data.orders.map(order => {
          const orderNumber = `OZME-${order._id.toString().slice(-8).toUpperCase()}`;
          
          return {
            id: orderNumber,
            _id: order._id,
            orderNumber: orderNumber,
            customer: order.user?.name || 'Guest',
            email: order.user?.email || order.shippingAddress?.email || '',
            phone: order.shippingAddress?.phone || '',
            amount: order.totalAmount || 0,
            paymentMethod: order.paymentMethod === 'Prepaid' ? 'Online' : 'COD',
            status: order.orderStatus || 'Pending',
            paymentStatus: order.paymentStatus || 'Pending',
            date: order.createdAt || new Date().toISOString(),
            items: order.items?.map(item => ({
              name: item.product?.name || 'Product',
              qty: item.quantity || 1,
              price: item.price || 0,
              size: item.size || '120ml'
            })) || [],
            subtotal: order.totalAmount + (order.discountAmount || 0),
            shipping: 0,
            discount: order.discountAmount || 0,
            shippingAddress: order.shippingAddress ? 
              `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || ''}`.trim() :
              '',
            trackingNumber: order.trackingNumber,
            timeline: generateTimeline(order),
            backendOrder: order, // Keep original for detailed view
          };
        });
        setOrders(transformedOrders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Generate timeline from order status
  const generateTimeline = (order) => {
    const timeline = [];
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStatus = order.orderStatus || 'Pending';
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    statusOrder.forEach((status, index) => {
      const isCompleted = index <= currentIndex || currentStatus === 'Cancelled';
      timeline.push({
        status: status,
        date: isCompleted ? (order.updatedAt || order.createdAt) : null,
        completed: isCompleted && currentStatus !== 'Cancelled',
      });
    });
    
    if (currentStatus === 'Cancelled') {
      timeline.push({
        status: 'Cancelled',
        date: order.updatedAt || order.createdAt,
        completed: true,
      });
    }
    
    return timeline;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter || (statusFilter === 'Canceled' && order.status === 'Cancelled');
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewOrder = (order) => {
    if (onViewOrder) {
      onViewOrder(order.id);
    } else {
      navigate(`/orders/${order._id || order.id}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Shipped': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      'Out for Delivery': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
      'Processing': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
      'Canceled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || statusStyles['Pending']}`}>
        {status}
      </span>
    );
  };

  // Stats calculation
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    totalRevenue: orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Canceled').reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Order <span className="font-serif italic text-amber-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Track and manage all your orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-100/20 dark:border-blue-900/20 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Orders</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.pending}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Delivered</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.delivered}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Revenue</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-800 dark:text-white rounded-xl"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Out for Delivery</option>
            <option>Delivered</option>
            <option>Canceled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
          <h2 className="text-xl font-light text-gray-900 dark:text-white">
            All <span className="font-serif italic">Orders</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/20 dark:divide-blue-900/20">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No orders found</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        {error ? 'Failed to load orders. Please try again.' : 'There are no orders matching your search criteria.'}
                      </p>
                      {error && (
                        <button
                          onClick={fetchOrders}
                          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{order.customer}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-2 text-amber-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-amber-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
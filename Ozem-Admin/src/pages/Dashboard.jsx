import { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, gradient, trend, loading }) => {
  return (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{value}</h3>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1">
              {trend.positive ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
              <span className={`text-sm font-semibold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">today</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    recentOrders: [],
    lowStockProducts: [],
  });

  // Fetch dashboard data from single endpoint
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/admin/dashboard/stats');
      
      if (response?.success && response.data) {
        // Safely extract all data with fallbacks
        setDashboardData({
          revenue: Number(response.data.revenue) || 0,
          totalOrders: Number(response.data.totalOrders) || 0,
          pendingOrders: Number(response.data.pendingOrders) || 0,
          processingOrders: Number(response.data.processingOrders) || 0,
          shippedOrders: Number(response.data.shippedOrders) || 0,
          deliveredOrders: Number(response.data.deliveredOrders) || 0,
          cancelledOrders: Number(response.data.cancelledOrders) || 0,
          totalCustomers: Number(response.data.totalCustomers) || 0,
          recentOrders: Array.isArray(response.data.recentOrders) ? response.data.recentOrders : [],
          lowStockProducts: Array.isArray(response.data.lowStockProducts) ? response.data.lowStockProducts : [],
        });
        setError(null); // Clear any previous errors
      } else {
        const errorMsg = response?.message || 'Failed to load dashboard data';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Shipped': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Processing': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || statusStyles['Pending']}`}>
        {status}
      </span>
    );
  };

  // No need for this - using dashboardData directly

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Dashboard <span className="font-serif italic text-amber-600">Overview</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-amber-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(dashboardData.revenue)}
          icon={DollarSign}
          gradient="from-amber-400 to-amber-600"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={(dashboardData.totalOrders || 0).toLocaleString()}
          icon={ShoppingCart}
          gradient="from-emerald-500 to-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Pending Orders"
          value={(dashboardData.pendingOrders || 0).toLocaleString()}
          icon={Clock}
          gradient="from-orange-500 to-orange-600"
          loading={loading}
        />
        <StatCard
          title="Processing Orders"
          value={(dashboardData.processingOrders || 0).toLocaleString()}
          icon={Truck}
          gradient="from-purple-500 to-pink-600"
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Delivered Orders"
          value={(dashboardData.deliveredOrders || 0).toLocaleString()}
          icon={CheckCircle}
          gradient="from-emerald-500 to-teal-600"
          loading={loading}
        />
        <StatCard
          title="Shipped Orders"
          value={(dashboardData.shippedOrders || 0).toLocaleString()}
          icon={Truck}
          gradient="from-blue-500 to-cyan-600"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={(dashboardData.totalCustomers || 0).toLocaleString()}
          icon={Users}
          gradient="from-blue-500 to-cyan-600"
          loading={loading}
        />
        <StatCard
          title="Cancelled Orders"
          value={(dashboardData.cancelledOrders || 0).toLocaleString()}
          icon={XCircle}
          gradient="from-rose-500 to-pink-600"
          loading={loading}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-gray-900 dark:text-white mb-1">
                  Recent <span className="font-serif italic">Orders</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Latest customer orders</p>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p className="mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !dashboardData.recentOrders || dashboardData.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/20 dark:divide-amber-900/20">
                  {dashboardData.recentOrders.map((order, index) => (
                    <tr key={order?.orderId || `order-${index}`} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {order?.orderId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{order?.customer || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order?.amount || 0)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order?.status || 'Pending')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="p-4 bg-amber-50/50 dark:bg-gray-900/50 border-t border-amber-100/20 dark:border-amber-900/20">
            <button 
              onClick={() => navigate('/orders')}
              className="w-full py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center justify-center gap-2 group"
            >
              View All Orders
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xl font-light text-gray-900 dark:text-white mb-1">
                    Low Stock <span className="font-serif italic">Alerts</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Products running low</p>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p>{error}</p>
            </div>
          ) : !dashboardData.lowStockProducts || dashboardData.lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
              <p className="text-emerald-600 font-medium">All products well stocked!</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {dashboardData.lowStockProducts.map((product, index) => (
                <div key={product?.id || `low-stock-${index}`} className="group flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/10 dark:to-orange-900/10 rounded-xl border border-rose-200 dark:border-rose-800/30 hover:shadow-lg transition-all">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">{product?.name || 'Unknown Product'}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ID: {product?.id ? product.id.slice(-6).toUpperCase() : 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{product?.stock || 0}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">units</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min: {product?.threshold || 5}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="p-4 bg-amber-50/50 dark:bg-gray-900/50 border-t border-amber-100/20 dark:border-amber-900/20">
            <button 
              onClick={() => navigate('/inventory')}
              className="w-full py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center justify-center gap-2 group"
            >
              Manage Inventory
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




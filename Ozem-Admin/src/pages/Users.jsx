import { Eye, Search, Filter, User, ShoppingBag, DollarSign, Calendar, Loader2, RefreshCw, AlertCircle, ArrowLeft, Package, MapPin, Heart, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Users = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // View user detail state
  const [viewingUser, setViewingUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiRequest(`/admin/users?${params.toString()}`);
      
      if (response?.success) {
        setUsers(response.data.users || []);
        setStats(response.data.stats || { total: 0, active: 0, totalOrders: 0, totalRevenue: 0 });
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single user details
  const fetchUserDetail = async (userId) => {
    setUserDetailLoading(true);
    try {
      const response = await apiRequest(`/admin/users/${userId}`);
      
      if (response?.success) {
        setViewingUser(response.data);
      } else {
        alert('Failed to fetch user details');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      alert(err.message || 'Failed to fetch user details');
    } finally {
      setUserDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleViewUser = (user) => {
    fetchUserDetail(user.id || user._id);
  };

  const getStatusBadge = (status) => {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLoginMethodBadge = (method) => {
    if (!method) return <span className="text-gray-400">—</span>;
    const badges = {
      otp: <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">OTP</span>,
      google: <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">Google</span>,
      email: <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">Email</span>,
    };
    return badges[method] || <span className="text-gray-400">—</span>;
  };

  const getAuthProvidersBadge = (providers) => {
    if (!providers || !Array.isArray(providers) || providers.length === 0) {
      return <span className="text-gray-400">—</span>;
    }
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {providers.map((provider, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {provider === 'otp' ? 'OTP' : provider === 'google' ? 'Google' : provider === 'email' ? 'Email' : provider}
          </span>
        ))}
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  // User Detail View
  if (viewingUser) {
    const user = viewingUser.user;
    const orders = viewingUser.orders || [];
    const wishlist = viewingUser.wishlist || [];

    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
              User <span className="font-serif italic text-blue-600">Details</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-light">View customer information</p>
          </div>
          <button 
            onClick={() => setViewingUser(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-100/20 dark:border-blue-900/20 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Users</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                {user.googleId && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                    Google Account
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(user.created)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.totalOrders}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Total Spent</span>
                <span className="font-bold text-lg text-emerald-600">{formatCurrency(user.totalSpent)}</span>
              </div>
              {/* Login Audit Info */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Login Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 text-sm">Last Login</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {formatDateTime(user.lastLoginAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 text-sm">Login Methods</span>
                    <div>{getAuthProvidersBadge(user.authProviders)}</div>
                  </div>
                  {user.authProviders && user.authProviders.length > 1 && (
                    <div className="mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <LogIn className="w-3 h-3" />
                        Linked account
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 text-sm">Signed In With</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {user.lastLoginIdentifier || '—'}
                    </span>
                  </div>
                  {user.lastLoginIp && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500 text-sm">IP Address</span>
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {user.lastLoginIp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Addresses
                </h3>
                <div className="space-y-3">
                  {user.addresses.map((addr, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mb-2">{addr.type}</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        {addr.name}, {addr.phone}
                      </p>
                      <p className="text-gray-500">
                        {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" /> Order History ({orders.length})
              </h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber || order.id}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Processing' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" /> Wishlist ({wishlist.length})
              </h3>
              
              {wishlist.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No items in wishlist</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {wishlist.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="w-full h-20 bg-gray-200 rounded mb-2 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-sm text-emerald-600 font-semibold">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Users List View
  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            User <span className="font-serif italic text-amber-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Manage and monitor all users</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-100/20 dark:border-blue-900/20 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Users</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Users</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.active}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Orders</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.totalOrders}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Revenue</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-800 dark:text-white rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
          <h2 className="text-xl font-light text-gray-900 dark:text-white">
            All <span className="font-serif italic">Users</span>
            {pagination.total > 0 && (
              <span className="ml-2 text-sm text-gray-500">({pagination.total} total)</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <User className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm">Users will appear here when they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Login Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Signed In With</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total Orders</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/20 dark:divide-blue-900/20">
                {users.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            (user.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</div>
                          {user.googleId && (
                            <span className="text-xs text-blue-500">Google</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatDateTime(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAuthProvidersBadge(user.authProviders)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {user.lastLoginIdentifier ? (
                        <span className="font-medium">{user.lastLoginIdentifier}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {user.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(user.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewUser(user)}
                        disabled={userDetailLoading}
                        className="p-2 text-amber-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-amber-50 dark:hover:bg-blue-900/20 rounded-lg transition-all disabled:opacity-50"
                        title="View user details"
                      >
                        {userDetailLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-amber-100/20 dark:border-blue-900/20 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;

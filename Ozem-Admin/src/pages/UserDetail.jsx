import { ArrowLeft, MapPin, ShoppingBag, Heart, User, Mail, Phone, Calendar, Package } from 'lucide-react';
import { useState } from 'react';

// Sample users data
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    totalOrders: 15,
    totalSpent: 2499.85,
    created: '2023-01-15',
    status: 'Active',
    orderHistory: [
      { id: 'ORD-001', date: '2024-03-15', amount: 299.99, status: 'Delivered' },
      { id: 'ORD-002', date: '2024-03-10', amount: 149.99, status: 'Delivered' },
      { id: 'ORD-003', date: '2024-03-05', amount: 399.99, status: 'Shipped' }
    ],
    wishlist: ['Wireless Headphones', 'Smart Watch', 'Laptop Stand'],
    addresses: [
      { type: 'Home', address: '123 Main St, New York, NY 10001' },
      { type: 'Work', address: '456 Business Ave, New York, NY 10002' }
    ]
  }
];

const UserDetail = ({ userId, onBack }) => {
  const [note, setNote] = useState('');
  const user = users.find(u => u.id === userId) || users[0];

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Shipped': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      'Processing': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Canceled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'}`}>
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
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-blue-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Users</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-1 tracking-tight">
                {user.name.split(' ')[0]} <span className="font-serif italic text-amber-600">{user.name.split(' ')[1]}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-light">{user.email}</p>
            </div>
          </div>
        </div>
        {getStatusBadge(user.status)}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Orders</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{user.totalOrders}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Spent</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">${user.totalSpent.toFixed(2)}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500 to-rose-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Wishlist Items</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{user.wishlist.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Profile <span className="font-serif italic text-amber-600">Information</span>
              </h2>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.created}</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Order <span className="font-serif italic text-amber-600">History</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/20 dark:divide-blue-900/20">
                  {user.orderHistory.map((order) => (
                    <tr key={order.id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{order.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">${order.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wishlist */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Wishlist <span className="font-serif italic text-amber-600">Items</span>
              </h2>
            </div>

            <div className="p-6">
              {user.wishlist.length > 0 ? (
                <div className="space-y-3">
                  {user.wishlist.map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-gray-700/30 dark:to-transparent rounded-xl border border-amber-100/20 dark:border-blue-900/20">
                      <Heart className="w-4 h-4 text-rose-500 mr-3 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No items in wishlist</p>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Add <span className="font-serif italic text-amber-600">Note</span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                rows="4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add internal notes for this user..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none"
              />

              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold">
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Contact <span className="font-serif italic text-amber-600">Info</span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.created}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Saved <span className="font-serif italic text-amber-600">Addresses</span>
              </h2>
            </div>

            <div className="p-6 space-y-3">
              {user.addresses.map((address, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-gray-700/30 dark:to-transparent rounded-xl border border-amber-100/20 dark:border-blue-900/20">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1 uppercase tracking-wide">{address.type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{address.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                User <span className="font-serif italic text-amber-600">Actions</span>
              </h2>
            </div>

            <div className="p-6 space-y-3">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold">
                Send Email
              </button>
              <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold">
                View Full History
              </button>
              <button className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold">
                Suspend Account
              </button>
              <button className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all font-semibold">
                Disable Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
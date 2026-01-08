import { Star, Check, EyeOff, Trash2, Search, Filter, MessageSquare, AlertCircle, TrendingUp, Eye, ArrowLeft, Loader2, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const Reviews = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reviews, setReviews] = useState([]);
  const [viewingReview, setViewingReview] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    avgRating: '0.0'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Fetch reviews from backend
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter && statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiRequest(`/admin/reviews?${params.toString()}`);
      
      if (response?.success) {
        setReviews(response.data.reviews || []);
        setStats(response.data.stats || { total: 0, pending: 0, avgRating: '0.0' });
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, pagination.page]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchReviews();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await apiRequest(`/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (response?.success) {
        setReviews(reviews.filter(r => r.id !== reviewId && r._id !== reviewId));
        // Refresh to update stats
        fetchReviews();
      } else {
        alert('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.message || 'Failed to delete review');
    }
  };

  const handleView = (review) => {
    setViewingReview(review);
    setShowViewModal(true);
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const response = await apiRequest(`/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response?.success) {
        setReviews(reviews.map(r => 
          (r.id === reviewId || r._id === reviewId) ? { ...r, status: newStatus } : r
        ));
        // Update stats
        if (response.data?.stats) {
          setStats(response.data.stats);
        } else {
          // Refresh to get updated stats
          fetchReviews();
        }
      } else {
        alert('Failed to update review status');
      }
    } catch (err) {
      console.error('Error updating review status:', err);
      alert(err.message || 'Failed to update review status');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Hidden': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || statusStyles['Pending']}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showViewModal) {
    return <ViewReviewModal 
      onBack={() => {
        setShowViewModal(false);
        setViewingReview(null);
      }} 
      review={viewingReview}
      onStatusChange={handleStatusChange}
    />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Product <span className="font-serif italic text-amber-600">Reviews</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Manage and moderate customer reviews</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-amber-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Reviews</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Reviews</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.pending}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Rating</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.avgRating}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Star className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews by user name..."
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
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Hidden">Hidden</option>
          </select>
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

      {/* Reviews Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
          <h2 className="text-xl font-light text-gray-900 dark:text-white">
            All <span className="font-serif italic">Reviews</span>
            {pagination.total > 0 && (
              <span className="ml-2 text-sm text-gray-500">({pagination.total} total)</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="ml-3 text-gray-500">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No reviews found</p>
            <p className="text-sm">Reviews will appear here once customers submit them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/20 dark:divide-amber-900/20">
                {reviews.map((review) => (
                  <tr key={review.id || review._id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold shadow-sm">
                          {(review.user || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{review.user}</div>
                          {review.userEmail && (
                            <div className="text-xs text-gray-500">{review.userEmail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{review.product}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{review.review || review.comment || 'No comment'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(review.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(review.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(review.id || review._id, 'Approved')}
                          className={`p-2 rounded-lg transition-all ${
                            review.status === 'Approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(review.id || review._id, 'Hidden')}
                          className={`p-2 rounded-lg transition-all ${
                            review.status === 'Hidden'
                              ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Hide"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleView(review)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="View review details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(review.id || review._id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-amber-100/20 dark:border-amber-900/20 flex items-center justify-between">
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

// View Review Modal Component
const ViewReviewModal = ({ onBack, review, onStatusChange }) => {
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-5 h-5 ${
              index < rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Hidden': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || statusStyles['Pending']}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Review <span className="font-serif italic text-blue-600">Details</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            View complete review information
          </p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-100/20 dark:border-blue-900/20 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Reviews</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 overflow-hidden shadow-lg">
          {/* User Header */}
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-100/20 dark:border-blue-900/20">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                {(review.user || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{review.user}</h2>
                {review.userEmail && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{review.userEmail}</p>
                )}
                <div className="flex items-center gap-4">
                  {renderStars(review.rating)}
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{review.rating}.0</span>
                </div>
              </div>
              <div>
                {getStatusBadge(review.status)}
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Product Reviewed
              </label>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{review.product}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Review Date
              </label>
              <p className="text-lg text-gray-700 dark:text-gray-300">{formatDate(review.date)}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Review Text
              </label>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
                  {review.review || review.comment || 'No comment provided'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Review ID</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">#{(review.id || review._id || '').toString().slice(-8)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{review.status}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-blue-100/20 dark:border-blue-900/20">
            <div className="flex items-center justify-center gap-4">
              {review.status !== 'Approved' && (
                <button 
                  onClick={() => {
                    onStatusChange(review.id || review._id, 'Approved');
                    onBack();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all font-semibold flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              )}
              {review.status !== 'Hidden' && (
                <button 
                  onClick={() => {
                    onStatusChange(review.id || review._id, 'Hidden');
                    onBack();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-xl hover:shadow-lg hover:shadow-gray-500/25 transition-all font-semibold flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Hide
                </button>
              )}
              <button 
                onClick={onBack}
                className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;

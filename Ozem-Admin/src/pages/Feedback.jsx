import { MessageSquare, Search, Calendar, Filter, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const Feedback = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    lovedIt: 0,
    recommendYes: 0,
  });

  // Fetch feedback from backend
  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/feedback');
      
      if (response?.success) {
        const allFeedback = response.data.feedback || [];
        setFeedback(allFeedback);
        
        // Calculate stats
        const total = allFeedback.length;
        const lovedIt = allFeedback.filter(f => f.fragrance_satisfaction === 'Loved it').length;
        const recommendYes = allFeedback.filter(f => f.recommend === 'Yes').length;
        
        setStats({
          total,
          lovedIt,
          recommendYes,
        });
      } else {
        setError('Failed to fetch feedback');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Filter feedback based on search term
  const filteredFeedback = feedback.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.order_ref?.toLowerCase().includes(searchLower) ||
      item.note?.toLowerCase().includes(searchLower) ||
      item.fragrance_satisfaction?.toLowerCase().includes(searchLower) ||
      item.packaging?.toLowerCase().includes(searchLower)
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get satisfaction badge color
  const getSatisfactionColor = (satisfaction) => {
    switch (satisfaction) {
      case 'Loved it':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Okay':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Not for me':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get packaging badge color
  const getPackagingColor = (packaging) => {
    switch (packaging) {
      case 'Excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Average':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading feedback...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">Feedback</h1>
            <p className="text-gray-600 dark:text-gray-400">View customer feedback submissions</p>
          </div>
          <button
            onClick={fetchFeedback}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-100/20 dark:border-amber-900/20 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Feedback</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-100/20 dark:border-amber-900/20 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loved It</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.lovedIt}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-100/20 dark:border-amber-900/20 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Would Recommend</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.recommendYes}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-2xl">👍</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order reference, note, or feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-100/20 dark:border-amber-900/20 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {searchTerm ? 'No feedback found matching your search.' : 'No feedback submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-amber-100/20 dark:border-amber-900/20 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </span>
                    {item.order_ref && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {item.order_ref}
                      </span>
                    )}
                  </div>

                  {/* MCQ Answers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Longevity */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longevity</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.longevity || 'N/A'}
                      </p>
                    </div>

                    {/* Projection */}
                    {item.projection && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projection</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.projection}
                        </p>
                      </div>
                    )}

                    {/* Fragrance Satisfaction */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Satisfaction</p>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getSatisfactionColor(item.fragrance_satisfaction)}`}>
                        {item.fragrance_satisfaction || 'N/A'}
                      </span>
                    </div>

                    {/* Packaging */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Packaging</p>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getPackagingColor(item.packaging)}`}>
                        {item.packaging || 'N/A'}
                      </span>
                    </div>

                    {/* Delivery */}
                    {item.delivery && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.delivery}
                        </p>
                      </div>
                    )}

                    {/* Recommend */}
                    {item.recommend && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recommend</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.recommend}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Additional Comments</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;


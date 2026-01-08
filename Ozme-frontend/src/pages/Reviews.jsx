import React, { useState } from 'react';
import { 
  Star, 
  Upload, 
  Filter,
  MessageSquare,
  ThumbsUp,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Camera,
  Send,
  Award
} from 'lucide-react';

const ReviewsPage = () => {
  const [filterRating, setFilterRating] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    text: '',
    product: ''
  });

  // Sample testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      rating: 5,
      product: "Velvet Oud",
      text: "Absolutely stunning fragrance! The longevity is exceptional and the scent is so luxurious. I've received countless compliments. Worth every penny!",
      date: "2 weeks ago",
      verified: true
    },
    {
      id: 2,
      name: "Rahul Mehta",
      rating: 5,
      product: "Noir Elegance",
      text: "This perfume has become my signature scent. The woody notes are perfectly balanced, and it lasts all day. Premium quality at an affordable price!",
      date: "3 weeks ago",
      verified: true
    },
    {
      id: 3,
      name: "Anjali Patel",
      rating: 4,
      product: "Rose Mystique",
      text: "Beautiful floral fragrance that's not overpowering. Love how elegant it is. The packaging is also gorgeous. Would definitely recommend!",
      date: "1 month ago",
      verified: true
    },
    {
      id: 4,
      name: "Vikram Singh",
      rating: 5,
      product: "Citrus Bliss",
      text: "Fresh and energizing! Perfect for daily wear. The citrus notes are vibrant without being sharp. Great for Indian weather.",
      date: "1 month ago",
      verified: true
    }
  ];

  const statsCards = [
    {
      icon: Star,
      value: "4.8",
      label: "Average Rating",
      gradient: "from-amber-500 to-amber-600"
    },
    {
      icon: Users,
      value: "2,340",
      label: "Total Reviews",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: ThumbsUp,
      value: "98%",
      label: "Satisfaction Rate",
      gradient: "from-emerald-500 to-emerald-600"
    }
  ];

  const filteredReviews = testimonials.filter(review => {
    if (filterRating === 'all') return true;
    return review.rating === parseInt(filterRating);
  });

  const handleSubmit = () => {
    alert('Review submitted successfully!');
    setFormData({ name: '', rating: 5, text: '', product: '' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-3 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full">
            {/* Tagline */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-amber-400 "></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mt-20">
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-300" />
                
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Customer Testimonials
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Customer
              </span>
              <span className="block font-serif italic text-amber-300 mt-1 sm:mt-1.5 md:mt-2" style={{
                textShadow: '0 4px 20px rgba(252, 211, 77, 0.4)'
              }}>
                Reviews
              </span>
            </h1>

            {/* Decorative Line */}
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Discover what our customers are saying about their favorite fragrances
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
              <Sparkles className="w-5 h-5 text-gray-900" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
              Trusted by
              <span className="block font-serif italic text-gray-800 mt-2">Thousands</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {statsCards.map((stat, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-lg p-10 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden text-center"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                {/* Icon */}
                <div className="relative mb-6 flex justify-center">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Value */}
                <div className="text-5xl font-light text-gray-900 mb-3">
                  {stat.value}
                </div>

                {/* Label */}
                <p className="text-gray-600 text-lg">
                  {stat.label}
                </p>

                {/* Decorative Element */}
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.gradient} w-0 group-hover:w-full transition-all duration-700`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Write Review Button */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Filter */}
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-6 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none bg-white text-gray-900 font-medium transition-all duration-300"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
              </select>
            </div>

            {/* Write Review Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center gap-3 shadow-md hover:shadow-xl"
            >
              {showForm ? (
                <>
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  <span>Write a Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Review Form */}
      {showForm && (
        <section className="py-16 bg-gradient-to-br from-amber-50 via-white to-orange-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-10 shadow-xl border border-amber-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-light text-gray-900 mb-2">
                  Share Your
                  <span className="block font-serif italic text-gray-800 mt-1">Experience</span>
                </h2>
                <p className="text-gray-600">
                  Help others discover their perfect fragrance
                </p>
              </div>

              <div onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 uppercase tracking-wide">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-300"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Product Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 uppercase tracking-wide">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-300"
                    placeholder="Which product did you purchase?"
                    required
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900 uppercase tracking-wide">
                    Your Rating *
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className="p-2 hover:scale-110 transition-transform duration-300"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors duration-300 ${
                            rating <= formData.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 uppercase tracking-wide">
                    Your Review *
                  </label>
                  <textarea
                    rows={6}
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-300 resize-none"
                    placeholder="Share your experience with this fragrance..."
                    required
                  />
                </div>

                {/* Upload Image */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 uppercase tracking-wide">
                    Upload Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-amber-400 transition-all duration-300 cursor-pointer bg-gray-50 hover:bg-amber-50">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2 font-medium">
                      Click to upload image
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <Send className="w-5 h-5" />
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reviews List */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
              What Our
              <span className="block font-serif italic text-gray-800 mt-2">Customers Say</span>
            </h2>
            <p className="text-lg text-gray-600 font-light">
              Real reviews from real customers
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-6">
            {filteredReviews.map((review, idx) => (
              <div
                key={review.id}
                className="group bg-white rounded-lg p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
              >
                <div className="flex items-start gap-6">
                  {/* Avatar Circle */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                      {review.name.charAt(0)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        {/* Stars */}
                        <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Name & Verified Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xl text-gray-900">
                            {review.name}
                          </h3>
                          {review.verified && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span className="text-xs font-semibold text-emerald-700">Verified</span>
                            </div>
                          )}
                        </div>

                        {/* Product */}
                        <p className="text-sm text-gray-600 font-medium">
                          Purchased: {review.product}
                        </p>
                      </div>

                      {/* Date */}
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {review.date}
                      </span>
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {review.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredReviews.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-2">
                No Reviews Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more reviews
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Love Your
            <span className="block font-serif italic text-amber-300 mt-2">Purchase?</span>
          </h2>

          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Share your experience and help others discover their perfect fragrance
          </p>

          <button
            onClick={() => {
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-12 py-4 bg-white text-black font-semibold rounded-lg hover:bg-amber-300 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 mx-auto group"
          >
            <MessageSquare className="w-5 h-5" />
            Write Your Review
          </button>
        </div>
      </section>
    </div>
  );
};

export default ReviewsPage;
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, Sparkles, Package } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', category: 'general', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      subtitle: 'Mon-Sat, 9 AM - 7 PM',
      value: '+91 92 74 74 3264',
      link: 'tel:+919274743264',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Mail,
      title: 'Email Us',
      subtitle: 'We reply within 24 hours',
      value: 'support@ozme.in',
      link: 'mailto:support@ozme.in',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      subtitle: 'Corporate Office',
      value: 'Ahmedabad, Gujarat',
      link: 'https://www.google.com/maps/search/?api=1&query=Ahmedabad,+Gujarat',
      gradient: 'from-gray-700 to-gray-900'
    }
  ];

  return (
    <div className="min-h-screen  bg-white">
       {/* Hero Section */}
      <section className="relative -top-4 min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/1200x/d4/d6/8b/d4d68bebc16df7affbb3e5c8b059f5f7.jpg)'
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative w-full flex items-center justify-center text-center px-4 sm:px-6 z-10 py-16">
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-0">
            {/* Tagline */}
            <div className="flex items-center justify-center gap-2 mt-20 mb-4 sm:mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />

                <span className="text-xs font-medium text-white tracking-wider uppercase">WE'RE HERE</span>
              </div>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white mb-3">
              <span className="block font-serif italic text-amber-400">Get in Touch</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/90 max-w-md mx-auto leading-relaxed font-light mt-2">
              We'd love to hear from you. Reach out and let's create something beautiful together.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden -mt-20">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <a
                  key={index}
                  href={info.link}
                  target={info.link.startsWith('http') ? '_blank' : '_self'}
                  rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group relative h-full min-h-[100px] overflow-hidden cursor-pointer rounded-lg block"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${info.gradient}`}></div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500"></div>

                  <div className="relative h-full flex flex-col p-6 text-white">
                    <div className="mb-6">
                      <Icon className="w-12 h-12 mb-4 opacity-90" />
                      <h3 className="text-xl font-light ">{info.title}</h3>
                      <div className="h-px bg-white/40  w-0 group-hover:w-16 transition-all duration-700"></div>
                    </div>
                    <div className="mt-auto">
                      <p className="text-white/70 text-sm mb-3 font-light">
                        {info.subtitle}
                      </p>
                      <p className="text-white font-medium hover:text-amber-200 transition-colors text-base">
                        {info.value}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Form and Info Grid */}
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white shadow-2xl p-8 lg:p-12">
                {/* Form Header */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-12 bg-gray-300"></div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Message</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight">
                    Send us a
                    <span className="block font-serif italic text-gray-800 mt-1">Message</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-3">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 focus:border-gray-900 transition-colors outline-none font-light"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-3">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 border-2 border-gray-200 focus:border-gray-900 transition-colors outline-none font-light"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-3">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 border-2 border-gray-200 focus:border-gray-900 transition-colors outline-none font-light"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-3">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 focus:border-gray-900 transition-colors outline-none font-light bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Support</option>
                      <option value="product">Product Question</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-3">
                      Your Message
                    </label>
                    <textarea
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 focus:border-gray-900 transition-colors outline-none resize-none font-light"
                      required
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg group"
                  >
                    <span>SEND MESSAGE</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-8">
              {/* WhatsApp Card */}
              <div className="relative aspect-[4/3] overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600"></div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500"></div>

                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <MessageCircle className="w-14 h-14 mb-6 opacity-90" />
                  <h3 className="text-2xl font-light mb-2">Quick Help?</h3>
                  <div className="h-px bg-white/40 mb-4 w-0 group-hover:w-24 transition-all duration-700"></div>
                  <p className="text-white/80 mb-6 text-sm leading-relaxed font-light">
                    Chat with us on WhatsApp for instant support and product recommendations.
                  </p>
                  <a
                    href="https://wa.me/919274743264"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white text-green-600 font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="bg-white shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Business Hours
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-light">Monday - Friday</span>
                    <span className="font-medium text-gray-900">9 AM - 7 PM</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-light">Saturday</span>
                    <span className="font-medium text-gray-900">9 AM - 5 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-light">Sunday</span>
                    <span className="font-medium text-red-600">Closed</span>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 text-white">
                <div className="text-center">
                  <div className="text-5xl font-light mb-2">24hrs</div>
                  <div className="h-px bg-white/40 w-16 mx-auto mb-4"></div>
                  <p className="text-white/80 font-light">
                    Average Response Time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map/CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
            <Sparkles className="w-5 h-5 text-gray-900" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>

          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
            Can't Find What You're
            <span className="block font-serif italic text-gray-800 mt-2">Looking For?</span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Our support team is always ready to help you find your perfect fragrance or answer any questions you may have
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/faqs"
              className="px-10 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg inline-block"
            >
              View FAQ
            </Link>
            <Link
              to="/shop"
              className="px-10 py-4 border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 inline-block"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
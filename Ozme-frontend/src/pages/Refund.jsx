import React, { useState } from 'react';
import { 
  ArrowRight, 
  Shield, 
  Package, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Mail,
  Phone,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const RefundPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const policyCards = [
    {
      icon: Package,
      title: "Damage Replacement Only",
      description: "We only offer replacements for products damaged or defective on arrival. Issue must be reported within 24 hours of delivery.",
      gradient: "from-orange-500 to-orange-600",
      details: []
    },
    {
      icon: XCircle,
      title: "No Returns or Refunds",
      description: "We do not accept returns or provide refunds for any opened, used, or delivered products unless the item is received damaged.",
      gradient: "from-red-500 to-red-600",
      details: []
    },
    {
      icon: AlertCircle,
      title: "Proof Required for Damage Claims",
      description: "Customer must provide unboxing video or photo proof of damage. Once verified, a replacement will be arranged.",
      gradient: "from-amber-500 to-amber-600",
      details: []
    }
  ];

  const returnSteps = [
    {
      number: "01",
      title: "Contact Support",
      description: "Reach out within 7 days of delivery"
    },
    {
      number: "02",
      title: "Get Authorization",
      description: "Receive return instructions via email"
    },
    {
      number: "03",
      title: "Pack Securely",
      description: "Use original packaging for safety"
    },
    {
      number: "04",
      title: "Ship Item",
      description: "Send to provided address"
    },
    {
      number: "05",
      title: "Receive Refund",
      description: "Get your money credited in 5-7 days"
    }
  ];

  const nonReturnableItems = [
    { icon: XCircle, text: "Opened or used perfumes (hygiene reasons)" },
    { icon: XCircle, text: "Products with broken seals" },
    { icon: XCircle, text: "Gift cards" },
    { icon: XCircle, text: "Sale items (unless defective)" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full">
            {/* Tagline */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-300" />
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Customer Protection
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Return &
              </span>
              <span className="block font-serif italic text-amber-300 mt-1 sm:mt-1.5 md:mt-2" style={{
                textShadow: '0 4px 20px rgba(252, 211, 77, 0.4)'
              }}>
                Refund Policy
              </span>
            </h1>

            {/* Decorative Line */}
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Your satisfaction is our priority. We've made returns simple and hassle-free.
            </p>

            {/* Last Updated */}
            <p className="text-xs sm:text-sm text-white/50 mt-4 sm:mt-5 md:mt-6 tracking-wide">
              Last updated: November 2024
            </p>
          </div>
        </div>
      </section>

      {/* Quick Overview Cards */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {policyCards.map((card, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-lg p-8 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
                onMouseEnter={() => setActiveSection(idx)}
                onMouseLeave={() => setActiveSection(null)}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500`}>
                    <card.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-light text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {card.description}
                </p>

                {/* Details List */}
                <ul className="space-y-2">
                  {card.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* Decorative Element */}
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${card.gradient} w-0 group-hover:w-full transition-all duration-700`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Process Steps */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
              <Sparkles className="w-5 h-5 text-gray-900" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>

            <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              How to
              <span className="block font-serif italic text-gray-800 mt-2">Return</span>
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Follow these simple steps for a smooth return experience
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-0"></div>

            {returnSteps.map((step, idx) => (
              <div key={idx} className="relative z-10">
                <div className="text-center">
                  {/* Number Circle */}
                  <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-6 shadow-xl relative group hover:scale-110 transition-transform duration-500">
                    <span className="text-4xl font-light text-white">{step.number}</span>
                    
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 rounded-full bg-gray-900 opacity-0 group-hover:opacity-20 animate-ping"></div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile */}
                {idx < returnSteps.length - 1 && (
                  <div className="md:hidden flex justify-center my-6">
                    <ArrowRight className="w-6 h-6 text-gray-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Non-Returnable Items */}
      <section className="py-24 bg-gradient-to-br from-red-50 via-white to-orange-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-semibold text-red-800 tracking-wide uppercase">
                Important Notice
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Non-Returnable Items
            </h2>
            <p className="text-gray-600">
              Please note that the following items cannot be returned
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nonReturnableItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Need Help with
            <span className="block font-serif italic text-amber-300 mt-2">Returns?</span>
          </h2>

          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Our customer support team is here to assist you with any questions about returns and refunds
          </p>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Mail className="w-10 h-10 text-amber-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-white/60 text-sm mb-3">support@ozme.in</p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Phone className="w-10 h-10 text-amber-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-white/60 text-sm mb-3">+91 87340 03264</p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Clock className="w-10 h-10 text-amber-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
              <p className="text-white/60 text-sm mb-3">Mon-Sat, 9 AM - 7 PM</p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="px-12 py-4 bg-white text-black font-semibold hover:bg-amber-300 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 mx-auto group">
            Contact Support
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>
      </section>

      {/* Additional Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-2xl font-light text-gray-900 mb-6">
              Additional Information
            </h3>
            
            <div className="space-y-6 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Damaged or Defective Items</h4>
                <p className="leading-relaxed">
                  If you receive a damaged or defective product, contact us immediately with photos of the damage. 
                  We will arrange for a replacement or full refund, and return shipping costs will be covered by us.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Late or Missing Refunds</h4>
                <p className="leading-relaxed">
                  If you haven't received your refund, please check your bank account, contact your credit card company, 
                  and then your bank. If you've done all of this and still haven't received your refund, contact us.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Exchanges</h4>
                <p className="leading-relaxed">
                  All approved replacements and exchanges will be completed and delivered within 15 working days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPage;

import React, { useState } from 'react';
import { 
  Truck,
  Package,
  MapPin,
  Clock,
  AlertCircle,
  Check,
  Info,
  X,
  ChevronDown,
  ArrowRight,
  Phone,
  Mail,
  Shield,
  CreditCard
} from 'lucide-react';

const ShippingPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const highlightCards = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to your location",
      gradient: "from-blue-500 to-blue-600",
      details: [
        "Express shipping available",
        "Nationwide coverage",
        "Real-time tracking"
      ]
    },
    {
      icon: Package,
      title: "Safe Packaging",
      description: "Your items are packed with care",
      gradient: "from-emerald-500 to-emerald-600",
      details: [
        "Secure packaging",
        "Fragile item protection",
        "Weather-resistant materials"
      ]
    },
    {
      icon: Shield,
      title: "Hassle-Free Returns",
      description: "Easy return policy for your peace of mind",
      gradient: "from-purple-500 to-purple-600",
      details: [
        "30-day return window",
        "Free returns on most items",
        "Simple return process"
      ]
    }
  ];

  const shippingSections = [
    {
      icon: Truck,
      number: "01",
      title: "Shipping Information",
      content: "We offer fast and reliable shipping across India. All orders are processed within 1-2 business days and typically delivered within 3-7 business days, depending on your location.",
      list: [
        "Orders processed within 24-48 hours",
        "Delivery time: 3-7 business days",
        "Express shipping available at checkout",
        "Order tracking provided for all shipments"
      ]
    },
    {
      icon: MapPin,
      number: "02",
      title: "Delivery Areas",
      content: "We currently ship to all major cities and towns across India. Some remote locations may have extended delivery times or additional shipping charges.",
      list: [
        "All major cities: 2-4 business days",
        "Tier 2/3 cities: 4-7 business days",
        "Remote areas: 7-10 business days",
        "International shipping available on request"
      ]
    },
    {
      icon: Clock,
      number: "03",
      title: "Order Processing",
      content: "We strive to process and ship all orders as quickly as possible. Please note that processing times may be longer during peak seasons or sale periods.",
      list: [
        "Order processing: 1-2 business days",
        "Weekend orders processed on Monday",
        "Same-day dispatch for orders before 2 PM"
      ]
    },
    {
      icon: AlertCircle,
      number: "04",
      title: "Shipping Restrictions",
      content: "Some items may have shipping restrictions based on your location. Please check the product page for specific shipping information."
    },
    {
      icon: CreditCard,
      number: "05",
      title: "Shipping Rates",
      content: "We offer competitive shipping rates based on your location and order value. Free shipping is available on all orders above ₹2000."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-3 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full mt-15">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-blue-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-300" />
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Fast & Reliable
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-blue-400"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Shipping
              </span>
              <span className="block font-serif italic text-blue-300 mt-1 sm:mt-1.5 md:mt-2" style={{
                textShadow: '0 4px 20px rgba(147, 197, 253, 0.4)'
              }}>
                Policy
              </span>
            </h1>

            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
            </div>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Fast, reliable shipping with real-time tracking and easy returns
            </p>

            <p className="text-xs sm:text-sm text-white/50 mt-4 sm:mt-5 md:mt-6 tracking-wide">
              Last updated: November 2024
            </p>
          </div>
        </div>
      </section>

      {/* Highlight Cards */}
      <section className="relative py-16 -mt-8 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlightCards.map((card, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
              >
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-white/90 mb-4">{card.description}</p>
                <ul className="space-y-2">
                  {card.details.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {shippingSections.map((section, index) => (
              <div 
                key={index} 
                id={`section-${index}`}
                className="group relative"
              >
                <div className="absolute -left-12 top-0 hidden md:block">
                  <span className="text-5xl font-serif font-bold text-gray-200 group-hover:text-blue-400 transition-colors duration-300">
                    {section.number}
                  </span>
                </div>
                
                <div 
                  className="cursor-pointer"
                  onClick={() => setActiveSection(activeSection === index ? null : index)}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-300">
                      <section.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                    <ChevronDown 
                      className={`ml-auto w-5 h-5 text-gray-400 transition-transform duration-300 ${activeSection === index ? 'transform rotate-180' : ''}`}
                    />
                  </div>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      activeSection === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pl-14">
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {section.content}
                      </p>
                      {section.list && (
                        <ul className="space-y-2 mb-4">
                          {section.list.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <ArrowRight className="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                              <span className="text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-8"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-6">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help with Your Order?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Our customer support team is here to help with any shipping questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:support@ozmeperfumes.com"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors duration-300"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Support
            </a>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors duration-300"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call +91 98765 43210
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShippingPage;
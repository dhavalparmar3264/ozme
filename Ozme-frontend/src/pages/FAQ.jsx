import React, { useState } from 'react';
import { 
  HelpCircle,
  MessageCircle,
  ChevronDown,
  Mail,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQsPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Are OZME perfumes long-lasting?",
      a: "Yes, our perfumes are crafted with high-quality Extrait de Parfum concentration, giving 8–12 hours of long-lasting performance."
    },
    {
      q: "Are the fragrance oils imported from France?",
      a: "Yes, our premium fragrance oils are sourced from France and the Middle East for authentic luxury scents."
    },
    {
      q: "Are your perfumes inspired by international brands?",
      a: "Yes, our fragrances are inspired by top global designer perfumes but crafted uniquely for the Indian climate."
    },
    {
      q: "What is the concentration level of your perfumes?",
      a: "All OZME perfumes are Extrait de Parfum with 25–30% perfume oil concentration."
    },
    {
      q: "Is the perfume safe for skin?",
      a: "Absolutely. Our perfumes are dermatologically tested and free from harmful chemicals."
    },
    {
      q: "What is the shelf life?",
      a: "Our perfumes have a shelf life of 48 months from the date of manufacture."
    },
    {
      q: "How should I store my perfume?",
      a: "Store in a cool, dry place away from direct sunlight to maintain longevity."
    },
    {
      q: "Does it perform well in hot weather?",
      a: "Yes, our formulas are optimized for Indian weather—hot, humid, or dry."
    },
    {
      q: "Are the perfumes unisex?",
      a: "Yes — we offer Unisex fragrances, along with Men's and Women's collections."
    },
    {
      q: "Do you offer Cash on Delivery?",
      a: "Yes, COD is available across India."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-amber-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-300" />
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Frequently Asked
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Questions
              </span>
            </h1>

            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
            </div>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Find answers to common questions about OZME perfumes
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 -mt-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset"
                >
                  <span className="text-lg font-semibold text-gray-900 pr-8 group-hover:text-amber-600 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'transform rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-300"></div>
            <Sparkles className="w-5 h-5 text-gray-900" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>

          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Us
            </Link>
            <a
              href="mailto:support@ozme.in"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQsPage;

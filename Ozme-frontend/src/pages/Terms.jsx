import React, { useState } from 'react';
import { 
  FileText,
  Scale,
  Shield,
  AlertCircle,
  Check,
  X,
  AlertTriangle,
  Info,
  BookOpen,
  Gavel,
  Mail,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

const TermsPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const highlightCards = [
    {
      icon: Scale,
      title: "Clear Terms",
      description: "Transparent and easy-to-understand terms of service",
      gradient: "from-amber-500 to-amber-600",
      details: [
        "No hidden clauses",
        "Simple language",
        "Easy navigation"
      ]
    },
    {
      icon: Shield,
      title: "Your Protection",
      description: "Your rights and protections clearly outlined",
      gradient: "from-blue-500 to-blue-600",
      details: [
        "User rights explained",
        "Privacy protection",
        "Secure transactions"
      ]
    },
    {
      icon: Check,
      title: "Fair Use",
      description: "Clear guidelines on acceptable use of our services",
      gradient: "from-emerald-500 to-emerald-600",
      details: [
        "Usage policies",
        "Content guidelines",
        "Account responsibilities"
      ]
    }
  ];

  const termsSections = [
    {
      icon: BookOpen,
      number: "01",
      title: "Introduction",
      content: "Welcome to Ozme Perfumes. By accessing our website, you agree to these terms and conditions. Please read them carefully before using our services.",
      list: [
        "Agreement to terms by using our services",
        "Eligibility requirements",
        "Service modifications"
      ]
    },
    {
      icon: Gavel,
      number: "02",
      title: "User Responsibilities",
      content: "As a user of our services, you agree to use our platform responsibly and in accordance with all applicable laws and regulations.",
      list: [
        "Accurate information provision",
        "Compliance with laws",
        "Prohibited activities"
      ]
    },
    {
      icon: Shield,
      number: "03",
      title: "Intellectual Property",
      content: "All content on this website is the property of Ozme Perfumes and protected by intellectual property laws.",
      list: [
        "Copyright protection",
        "Trademark usage",
        "Content restrictions"
      ]
    },
    {
      icon: AlertTriangle,
      number: "04",
      title: "Limitations",
      content: "Ozme Perfumes is not liable for indirect, incidental, or consequential damages arising from the use of our services."
    },
    {
      icon: Info,
      number: "05",
      title: "Changes to Terms",
      content: "We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of the modified terms."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-3 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-amber-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-300" />
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Legal Information
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Terms &
              </span>
              <span className="block font-serif italic text-amber-300 mt-1 sm:mt-1.5 md:mt-2" style={{
                textShadow: '0 4px 20px rgba(252, 211, 77, 0.4)'
              }}>
                Conditions
              </span>
            </h1>

            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
            </div>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Please read these terms carefully before using our services
            </p>

            <p className="text-xs sm:text-sm text-white/50 mt-4 sm:mt-5 md:mt-6 tracking-wide">
              Last updated: November 2024
            </p>
          </div>
        </div>
      </section>

      {/* Highlight Cards */}
      <section className="relative py-16 -mt-8 z-20 ">
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
            {termsSections.map((section, index) => (
              <div 
                key={index} 
                id={`section-${index}`}
                className="group relative"
              >
                <div className="absolute -left-12 top-0 hidden md:block">
                  <span className="text-5xl font-serif font-bold text-gray-200 group-hover:text-amber-400 transition-colors duration-300">
                    {section.number}
                  </span>
                </div>
                
                <div 
                  className="cursor-pointer"
                  onClick={() => setActiveSection(activeSection === index ? null : index)}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-4 group-hover:bg-amber-100 transition-colors duration-300">
                      <section.icon className={`w-5 h-5 text-amber-600`} />
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
                              <ArrowRight className="w-4 h-4 text-amber-500 mt-1 mr-2 flex-shrink-0" />
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
      <section className="py-16 bg-gradient-to-r from-amber-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-6">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            If you have any questions about these terms, please don't hesitate to contact us.
          </p>
          <a
            href="mailto:support@ozmeperfumes.com"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 md:py-4 md:text-lg md:px-10 transition-colors duration-300"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
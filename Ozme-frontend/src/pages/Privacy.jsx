import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Eye,
  Database,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Sparkles,
  CheckCircle,
  FileText,
  Globe,
  Key,
  Settings,
  UserCheck,
  Baby,
  Bell
} from 'lucide-react';

const PrivacyPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const highlightCards = [
    {
      icon: Lock,
      title: "Secure Data",
      description: "Your information is protected with industry-standard encryption",
      gradient: "from-blue-500 to-blue-600",
      details: [
        "SSL/TLS encryption",
        "Secure payment processing",
        "Regular security audits"
      ]
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We're clear about how we collect and use your data",
      gradient: "from-emerald-500 to-emerald-600",
      details: [
        "Clear data practices",
        "No hidden collection",
        "Regular policy updates"
      ]
    },
    {
      icon: UserCheck,
      title: "Your Control",
      description: "You have full control over your personal information",
      gradient: "from-purple-500 to-purple-600",
      details: [
        "Access your data anytime",
        "Easy opt-out options",
        "Delete account option"
      ]
    }
  ];

  const privacySections = [
    {
      icon: Database,
      number: "01",
      title: "Information We Collect",
      content: "We collect information you provide directly to us, including name, email address, phone number, shipping and billing addresses, payment information, order history and preferences, and communication preferences.",
      list: [
        "Name, email address, phone number",
        "Shipping and billing addresses",
        "Payment information",
        "Order history and preferences",
        "Communication preferences"
      ]
    },
    {
      icon: Settings,
      number: "02",
      title: "How We Use Your Information",
      content: "We use the information we collect to process and fulfill your orders, send order confirmations and updates, respond to your inquiries and provide customer support, send marketing communications (with your consent), improve our products and services, and detect and prevent fraud.",
      list: [
        "Process and fulfill your orders",
        "Send order confirmations and updates",
        "Respond to inquiries and provide support",
        "Send marketing communications",
        "Improve products and services",
        "Detect and prevent fraud"
      ]
    },
    {
      icon: Users,
      number: "03",
      title: "Information Sharing",
      content: "We do not sell your personal information. We may share your information with service providers who help us operate our business, shipping carriers to deliver your orders, payment processors to handle transactions, and law enforcement when required by law.",
      list: [
        "Service providers who help us operate",
        "Shipping carriers to deliver orders",
        "Payment processors for transactions",
        "Law enforcement when required by law"
      ]
    },
    {
      icon: Shield,
      number: "04",
      title: "Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure."
    },
    {
      icon: Globe,
      number: "05",
      title: "Cookies and Tracking",
      content: "We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand user preferences."
    },
    {
      icon: Key,
      number: "06",
      title: "Your Rights",
      content: "You have the right to access your personal information, correct inaccurate information, request deletion of your information, opt-out of marketing communications, and withdraw consent at any time.",
      list: [
        "Access your personal information",
        "Correct inaccurate information",
        "Request deletion of your information",
        "Opt-out of marketing communications",
        "Withdraw consent at any time"
      ]
    },
    {
      icon: Baby,
      number: "07",
      title: "Children's Privacy",
      content: "Our services are not directed to children under 18. We do not knowingly collect personal information from children."
    },
    {
      icon: Bell,
      number: "08",
      title: "Changes to Privacy Policy",
      content: "We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on our website."
    }
  ];

  const dataTypes = [
    { label: "Personal Information", icon: UserCheck, color: "blue" },
    { label: "Payment Data", icon: Lock, color: "emerald" },
    { label: "Order History", icon: FileText, color: "purple" },
    { label: "Communication Preferences", icon: Mail, color: "amber" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] -top-3 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] flex items-center justify-center text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 z-10">
          <div className="max-w-4xl mx-auto w-full">
            {/* Tagline */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-r from-transparent to-blue-400"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-300" />
                <span className="text-[10px] sm:text-xs font-semibold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
                  Your Data Protection
                </span>
              </div>
              <div className="h-px w-6 sm:w-8 md:w-10 lg:w-12 bg-gradient-to-l from-transparent to-blue-400"></div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-5 md:mb-6 leading-tight sm:leading-[1.1] md:leading-[1.15]">
              <span className="block text-white font-light tracking-tight">
                Privacy
              </span>
              <span className="block font-serif italic text-blue-300 mt-1 sm:mt-1.5 md:mt-2" style={{
                textShadow: '0 4px 20px rgba(147, 197, 253, 0.4)'
              }}>
                Policy
              </span>
            </h1>

            {/* Decorative Line */}
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-24 sm:w-32 md:w-40 lg:w-48 bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              We value your privacy and are committed to protecting your personal information
            </p>

            {/* Last Updated */}
            <p className="text-xs sm:text-sm text-white/50 mt-4 sm:mt-5 md:mt-6 tracking-wide">
              Last updated: November 2024
            </p>
          </div>
        </div>
      </section>

      {/* Highlight Cards */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
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
              Our
              <span className="block font-serif italic text-gray-800 mt-2">Promise</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlightCards.map((card, idx) => (
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

      {/* Data Types Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-light text-gray-900 mb-8 text-center">
            Types of Data We Protect
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dataTypes.map((type, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-full bg-${type.color}-100 flex items-center justify-center mb-3`}>
                  <type.icon className={`w-6 h-6 text-${type.color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {type.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Sections */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              Privacy
              <span className="block font-serif italic text-gray-800 mt-2">Details</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Everything you need to know about how we handle your data
            </p>
          </div>

          {/* Sections Grid */}
          <div className="space-y-6">
            {privacySections.map((section, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-lg p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
              >
                <div className="flex items-start gap-6">
                  {/* Number & Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {/* Number Circle */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <span className="text-xl font-light text-white">{section.number}</span>
                      </div>
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                        <section.icon className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {section.content}
                    </p>

                    {/* List if available */}
                    {section.list && (
                      <ul className="space-y-2 mt-4">
                        {section.list.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-10 shadow-xl border border-blue-100">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Your Privacy Rights
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Under applicable data protection laws, you have several rights regarding your personal information. 
                  You can exercise these rights at any time by contacting us through the channels provided below.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We are committed to responding to your requests promptly and in accordance with applicable law.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Privacy
            <span className="block font-serif italic text-blue-300 mt-2">Questions?</span>
          </h2>

          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Have questions about how we protect your data? Our team is here to help.
          </p>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Mail className="w-10 h-10 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-white/60 text-sm">privacy@ozmeperfumes.com</p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Phone className="w-10 h-10 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-white/60 text-sm">+91 98765 43210</p>
            </div>
          </div>
        </div>
      </section>

      {/* GDPR Compliance Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 to-white p-10 rounded-lg shadow-sm border border-emerald-100">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Compliance & Standards
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We comply with applicable data protection regulations and industry standards to ensure 
                  your personal information is handled with the highest level of care and security.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Our privacy practices are regularly reviewed and updated to maintain compliance with 
                  evolving regulations and best practices in data protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '../assets/image/logo.png';  // Make sure this path is correct

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    quickLinks: [
      { name: 'About Us', href: '/about' },
      { name: 'Shop', href: '/shop' },
      { name: 'Contact', href: '/contact' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'FAQs', href: '/faqs' },
      { name: 'Track Order', href: '/track-order' }
    ],
    customerCare: [
      { name: 'Shipping Policy', href: '/shipping' },
      { name: 'Return & Refund', href: '/refund' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms & Conditions', href: '/terms' },
      // { name: 'Terms of Service', href: '/terms' },
      // { name: 'Disclaimer', href: '#' }
    ],
    legal: [
      { name: 'Grievance Officer', href: '#' },
      { name: 'Our Policies', href: '/privacy' }
    ],
availableOn: [
      { name: 'Nykaa', href: '#' },
      { name: 'Amazon', href: '#' },
      { name: 'Flipkart', href: '#' },
      { name: 'Myntra', href: '#' },
      { name: 'Purplle', href: '#' }
    ]
  };

  const paymentLogos = [
    { name: 'Visa', bg: 'bg-blue-600' },
    { name: 'MC', bg: 'bg-red-600' },
    { name: 'PayPal', bg: 'bg-blue-500' },
    { name: 'GPay', bg: 'bg-green-600' }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <img
                  src={logo}
                  alt="OZME PERFUMES"
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold">OZME</div>
                <div className="text-[10px] tracking-widest text-gray-400 -mt-1">PERFUMES</div>
              </div>
            </a>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your destination for luxury fragrances inspired by international brands. Quality perfumes at prices that make sense.
            </p>

            {/* Contact Information */}
            <div className="space-y-3">
              <a href="mailto:support@ozme.in" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <span>support@ozme.in</span>
              </a>

              <div className="flex flex-col gap-3">
                <a href="tel:+918734003264" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span>+91 87340 03264</span>
                </a>

                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Ahmedabad,+Gujarat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span>Ahmedabad, Gujarat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold text-white mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></span>
            </h3>
            <ul className="space-y-3">
              {footerSections.quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-base font-bold text-white mb-6 relative inline-block">
              Customer Care
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></span>
            </h3>
            <ul className="space-y-3">
              {footerSections.customerCare.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-base font-bold text-white mb-6 relative inline-block">
              Legal
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></span>
            </h3>
            <ul className="space-y-3">
              {footerSections.legal.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="text-base font-bold text-white mb-6 relative inline-block">
              Available On
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></span>
            </h3>
            <ul className="space-y-3">
              {footerSections.availableOn.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-8 -mt-8">Follow Us</h3>
          <div className="flex gap-3 -mt-6">
            {[
              { icon: Facebook, label: 'Facebook', href: '#' },
              { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/ozmeperfume/' }
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 group"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        {/* Middle Section - Social & Payment */}


        {/* Newsletter Section */}
        {/* <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-6">Subscribe for exclusive offers and fragrance tips</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 whitespace-nowrap">
                Subscribe Now
              </button>
            </div>
          </div>
        </div> */}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} Ozme Perfumes. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Designed & Developed by</span>
              <a 
                href="http://creativewebcrafters.site/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Creative WebCrafters
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-700">•</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

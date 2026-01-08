import { Save, CreditCard, Truck, Mail, Store, Check } from 'lucide-react';
import { useState } from 'react';

const Settings = () => {
  // Payment Settings
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');

  // Shipping Settings
  const [shippingCharge, setShippingCharge] = useState('9.99');
  const [freeShippingLimit, setFreeShippingLimit] = useState('100');

  // Email Templates
  const [orderConfirmationEmail, setOrderConfirmationEmail] = useState(
    'Dear {{customer_name}},\n\nThank you for your order!\n\nOrder ID: {{order_id}}\nTotal Amount: {{total_amount}}\n\nYour order will be processed shortly.\n\nBest regards,\nYour Store'
  );
  const [shippingConfirmationEmail, setShippingConfirmationEmail] = useState(
    'Dear {{customer_name}},\n\nYour order has been shipped!\n\nOrder ID: {{order_id}}\nTracking Number: {{tracking_number}}\n\nYou can track your order using the link above.\n\nBest regards,\nYour Store'
  );

  // Store Information
  const [storeName, setStoreName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Save handlers
  const handleSavePayment = () => {
    const settings = {
      razorpayEnabled,
      codEnabled,
      razorpayKey,
      razorpaySecret
    };
    console.log('Saving payment settings:', settings);
    alert('Payment settings saved successfully!');
  };

  const handleSaveShipping = () => {
    const settings = {
      shippingCharge,
      freeShippingLimit
    };
    console.log('Saving shipping settings:', settings);
    alert('Shipping settings saved successfully!');
  };

  const handleSaveEmailTemplates = () => {
    const templates = {
      orderConfirmationEmail,
      shippingConfirmationEmail
    };
    console.log('Saving email templates:', templates);
    alert('Email templates saved successfully!');
  };

  const handleSaveStoreInfo = () => {
    const info = {
      storeName,
      supportEmail,
      supportPhone,
      storeAddress
    };
    console.log('Saving store information:', info);
    alert('Store information saved successfully!');
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Store <span className="font-serif italic text-amber-600">Settings</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Configure your store preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Payment <span className="font-serif italic">Settings</span>
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* RazorPay Toggle */}
            <div className="flex items-center justify-between p-5 bg-amber-50/50 dark:bg-gray-900/50 rounded-xl border border-amber-100/20 dark:border-amber-900/20 hover:shadow-md transition-all">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                  RazorPay Payment Gateway
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enable online payments through RazorPay
                </p>
              </div>
              <button
                onClick={() => setRazorpayEnabled(!razorpayEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                  razorpayEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    razorpayEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {razorpayEnabled && (
              <div className="pl-4 space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    API Key ID
                  </label>
                  <input
                    type="text"
                    value={razorpayKey}
                    onChange={(e) => setRazorpayKey(e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxx"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    API Secret Key
                  </label>
                  <input
                    type="password"
                    value={razorpaySecret}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* COD Toggle */}
            <div className="flex items-center justify-between p-5 bg-amber-50/50 dark:bg-gray-900/50 rounded-xl border border-amber-100/20 dark:border-amber-900/20 hover:shadow-md transition-all">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                  Cash on Delivery (COD)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Allow customers to pay on delivery
                </p>
              </div>
              <button
                onClick={() => setCodEnabled(!codEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                  codEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    codEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSavePayment}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
              >
                <Save className="w-4 h-4" />
                Save Payment Settings
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Shipping <span className="font-serif italic">Settings</span>
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Standard Shipping Charge ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={shippingCharge}
                onChange={(e) => setShippingCharge(e.target.value)}
                placeholder="9.99"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Free Shipping Minimum Order ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={freeShippingLimit}
                onChange={(e) => setFreeShippingLimit(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Orders above this amount will get free shipping
              </p>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSaveShipping}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
              >
                <Save className="w-4 h-4" />
                Save Shipping Settings
              </button>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Email <span className="font-serif italic">Templates</span>
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Order Confirmation Email
              </label>
              <div className="mb-3 p-3 bg-amber-50/50 dark:bg-gray-900/50 rounded-lg border border-amber-100/20 dark:border-amber-900/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Available variables:</span> {'{{customer_name}}'}, {'{{order_id}}'}, {'{{total_amount}}'}
                </p>
              </div>
              <textarea
                value={orderConfirmationEmail}
                onChange={(e) => setOrderConfirmationEmail(e.target.value)}
                rows="8"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Shipping Confirmation Email
              </label>
              <div className="mb-3 p-3 bg-amber-50/50 dark:bg-gray-900/50 rounded-lg border border-amber-100/20 dark:border-amber-900/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Available variables:</span> {'{{customer_name}}'}, {'{{order_id}}'}, {'{{tracking_number}}'}
                </p>
              </div>
              <textarea
                value={shippingConfirmationEmail}
                onChange={(e) => setShippingConfirmationEmail(e.target.value)}
                rows="8"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSaveEmailTemplates}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
              >
                <Save className="w-4 h-4" />
                Save Email Templates
              </button>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Store <span className="font-serif italic">Information</span>
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Your Store Name"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@yourstore.com"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+1 234-567-8900"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Store Address
              </label>
              <textarea
                rows="3"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Enter your store address"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSaveStoreInfo}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
              >
                <Save className="w-4 h-4" />
                Save Store Information
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
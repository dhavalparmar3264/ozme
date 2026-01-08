export const dashboardStats = {
  totalSales: { value: '$45,231.89', trend: { positive: true, value: '+20.1%' } },
  totalOrders: { value: '328', trend: { positive: true, value: '+12.5%' } },
  pendingOrders: { value: '23', trend: { positive: false, value: '-5.2%' } },
  shippedOrders: { value: '145', trend: { positive: true, value: '+8.3%' } },
  deliveredOrders: { value: '142', trend: { positive: true, value: '+15.7%' } },
  canceledOrders: { value: '18', trend: { positive: false, value: '-3.1%' } },
  totalUsers: { value: '1,234', trend: { positive: true, value: '+18.2%' } },
  totalProducts: { value: '456', trend: { positive: true, value: '+5.4%' } },
};

export const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '$234.50', status: 'Delivered', date: '2024-01-20' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '$156.00', status: 'Shipped', date: '2024-01-20' },
  { id: 'ORD-003', customer: 'Bob Johnson', amount: '$89.99', status: 'Pending', date: '2024-01-19' },
  { id: 'ORD-004', customer: 'Alice Brown', amount: '$445.20', status: 'Processing', date: '2024-01-19' },
  { id: 'ORD-005', customer: 'Charlie Wilson', amount: '$123.45', status: 'Delivered', date: '2024-01-18' },
];

export const lowStockProducts = [
  { id: 1, name: 'Wireless Mouse', sku: 'WM-001', stock: 5, threshold: 10 },
  { id: 2, name: 'USB Cable', sku: 'UC-002', stock: 3, threshold: 15 },
  { id: 3, name: 'Phone Case', sku: 'PC-003', stock: 8, threshold: 20 },
  { id: 4, name: 'Screen Protector', sku: 'SP-004', stock: 2, threshold: 10 },
];

export const products = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=200',
    name: 'Wireless Headphones',
    category: 'Electronics',
    brand: 'TechAudio',
    price: 89.99,
    discount: 10,
    stock: 45,
    status: 'Active',
    sku: 'WH-001'
  },
  {
    id: 2,
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=200',
    name: 'Smart Watch',
    category: 'Electronics',
    brand: 'FitTech',
    price: 199.99,
    discount: 15,
    stock: 23,
    status: 'Active',
    sku: 'SW-002'
  },
  {
    id: 3,
    image: 'https://images.pexels.com/photos/1476321/pexels-photo-1476321.jpeg?auto=compress&cs=tinysrgb&w=200',
    name: 'Laptop Backpack',
    category: 'Accessories',
    brand: 'TravelGear',
    price: 49.99,
    discount: 0,
    stock: 67,
    status: 'Active',
    sku: 'LB-003'
  },
  {
    id: 4,
    image: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=200',
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    brand: 'SoundMax',
    price: 59.99,
    discount: 20,
    stock: 5,
    status: 'Low Stock',
    sku: 'BS-004'
  },
  {
    id: 5,
    image: 'https://images.pexels.com/photos/583842/pexels-photo-583842.jpeg?auto=compress&cs=tinysrgb&w=200',
    name: 'Wireless Mouse',
    category: 'Accessories',
    brand: 'TechPro',
    price: 29.99,
    discount: 5,
    stock: 120,
    status: 'Active',
    sku: 'WM-005'
  },
];

export const orders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234-567-8900',
    amount: 234.50,
    paymentMethod: 'Credit Card',
    status: 'Delivered',
    date: '2024-01-20',
    shippingAddress: '123 Main St, New York, NY 10001',
    items: [
      { name: 'Wireless Headphones', qty: 2, price: 89.99 },
      { name: 'USB Cable', qty: 3, price: 14.99 },
    ],
    subtotal: 224.95,
    shipping: 9.55,
    discount: 0,
    timeline: [
      { status: 'Order Placed', date: '2024-01-20 10:30 AM', completed: true },
      { status: 'Processing', date: '2024-01-20 02:15 PM', completed: true },
      { status: 'Shipped', date: '2024-01-21 09:00 AM', completed: true },
      { status: 'Delivered', date: '2024-01-23 03:45 PM', completed: true },
    ]
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 234-567-8901',
    amount: 156.00,
    paymentMethod: 'PayPal',
    status: 'Shipped',
    date: '2024-01-20',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    items: [
      { name: 'Smart Watch', qty: 1, price: 199.99 },
    ],
    subtotal: 199.99,
    shipping: 0,
    discount: 43.99,
    timeline: [
      { status: 'Order Placed', date: '2024-01-20 11:20 AM', completed: true },
      { status: 'Processing', date: '2024-01-20 03:30 PM', completed: true },
      { status: 'Shipped', date: '2024-01-22 10:15 AM', completed: true },
      { status: 'Delivered', date: '', completed: false },
    ]
  },
  {
    id: 'ORD-003',
    customer: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 234-567-8902',
    amount: 89.99,
    paymentMethod: 'Cash on Delivery',
    status: 'Pending',
    date: '2024-01-19',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    items: [
      { name: 'Bluetooth Speaker', qty: 1, price: 59.99 },
      { name: 'Wireless Mouse', qty: 1, price: 29.99 },
    ],
    subtotal: 89.98,
    shipping: 5.00,
    discount: 4.99,
    timeline: [
      { status: 'Order Placed', date: '2024-01-19 04:45 PM', completed: true },
      { status: 'Processing', date: '', completed: false },
      { status: 'Shipped', date: '', completed: false },
      { status: 'Delivered', date: '', completed: false },
    ]
  },
];

export const inventory = [
  { id: 1, product: 'Wireless Headphones', sku: 'WH-001', stock: 45, warehouse: 'Warehouse A', alert: false },
  { id: 2, product: 'Smart Watch', sku: 'SW-002', stock: 23, warehouse: 'Warehouse B', alert: false },
  { id: 3, product: 'Laptop Backpack', sku: 'LB-003', stock: 67, warehouse: 'Warehouse A', alert: false },
  { id: 4, product: 'Bluetooth Speaker', sku: 'BS-004', stock: 5, warehouse: 'Warehouse C', alert: true },
  { id: 5, product: 'Wireless Mouse', sku: 'WM-005', stock: 120, warehouse: 'Warehouse A', alert: false },
  { id: 6, product: 'USB Cable', sku: 'UC-006', stock: 3, warehouse: 'Warehouse B', alert: true },
];

export const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234-567-8900',
    totalOrders: 12,
    totalSpent: 1456.78,
    created: '2023-06-15',
    status: 'Active',
    addresses: [
      { type: 'Shipping', address: '123 Main St, New York, NY 10001' },
      { type: 'Billing', address: '123 Main St, New York, NY 10001' },
    ],
    orderHistory: [
      { id: 'ORD-001', date: '2024-01-20', amount: 234.50, status: 'Delivered' },
      { id: 'ORD-015', date: '2024-01-10', amount: 156.00, status: 'Delivered' },
    ],
    wishlist: ['Wireless Headphones', 'Smart Watch', 'Laptop Backpack'],
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 234-567-8901',
    totalOrders: 8,
    totalSpent: 892.45,
    created: '2023-08-22',
    status: 'Active',
    addresses: [
      { type: 'Shipping', address: '456 Oak Ave, Los Angeles, CA 90001' },
    ],
    orderHistory: [
      { id: 'ORD-002', date: '2024-01-20', amount: 156.00, status: 'Shipped' },
    ],
    wishlist: ['Bluetooth Speaker'],
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 234-567-8902',
    totalOrders: 5,
    totalSpent: 445.90,
    created: '2023-11-05',
    status: 'Active',
    addresses: [
      { type: 'Shipping', address: '789 Pine Rd, Chicago, IL 60601' },
    ],
    orderHistory: [
      { id: 'ORD-003', date: '2024-01-19', amount: 89.99, status: 'Pending' },
    ],
    wishlist: [],
  },
];

export const coupons = [
  {
    id: 1,
    code: 'SAVE10',
    type: 'Percentage',
    value: 10,
    minOrder: 50,
    maxDiscount: 20,
    usageLimit: 100,
    usedCount: 45,
    expiry: '2024-12-31',
    status: 'Active',
  },
  {
    id: 2,
    code: 'FLAT50',
    type: 'Fixed',
    value: 50,
    minOrder: 200,
    maxDiscount: 50,
    usageLimit: 50,
    usedCount: 23,
    expiry: '2024-06-30',
    status: 'Active',
  },
  {
    id: 3,
    code: 'WELCOME20',
    type: 'Percentage',
    value: 20,
    minOrder: 0,
    maxDiscount: 30,
    usageLimit: 500,
    usedCount: 312,
    expiry: '2024-12-31',
    status: 'Active',
  },
];

export const reviews = [
  {
    id: 1,
    user: 'John Doe',
    product: 'Wireless Headphones',
    rating: 5,
    review: 'Excellent sound quality! Very comfortable to wear for long periods.',
    date: '2024-01-18',
    status: 'Approved',
  },
  {
    id: 2,
    user: 'Jane Smith',
    product: 'Smart Watch',
    rating: 4,
    review: 'Great product, battery life could be better.',
    date: '2024-01-17',
    status: 'Approved',
  },
  {
    id: 3,
    user: 'Bob Johnson',
    product: 'Bluetooth Speaker',
    rating: 3,
    review: 'Average product, sound is okay but not great.',
    date: '2024-01-16',
    status: 'Pending',
  },
  {
    id: 4,
    user: 'Alice Brown',
    product: 'Wireless Mouse',
    rating: 5,
    review: 'Perfect mouse! Very responsive and comfortable.',
    date: '2024-01-15',
    status: 'Approved',
  },
  {
    id: 5,
    user: 'Charlie Wilson',
    product: 'Laptop Backpack',
    rating: 2,
    review: 'Quality is not as expected. Material feels cheap.',
    date: '2024-01-14',
    status: 'Hidden',
  },
];
